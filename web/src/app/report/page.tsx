'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { MapPin, Upload, CheckCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { useAuthGuard } from '@/hooks/useAuthGuard'

const LocationPicker = dynamic(() => import('@/components/report/LocationPicker').then(module => module.LocationPicker), {
  ssr: false,
  loading: () => <div className="mt-3 h-64 animate-pulse rounded-2xl bg-gray-100" />,
})

export default function ReportPage() {
  const { email: guardEmail, checking } = useAuthGuard()
  const [user, setUser] = useState<{ id: number; email: string | null; name: string } | null>(null);
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)

  const [reports, setReports] = useState<Array<{
    id: number;
    location: string;
    wasteType: string;
    amount: string;
    createdAt: string;
  }>>([]);

  const [newReport, setNewReport] = useState({
    location: '',
    type: '',
    amount: '',
  })

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [verificationResult, setVerificationResult] = useState<{
    isWaste: boolean;
    wasteTypes: string[];
    estimatedAmount: string;
    confidence: number;
    notes: string;
    verificationToken: string;
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewReport({ ...newReport, [name]: value })
    if (name === 'location') setCoordinates(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.size > 4 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
        toast.error('Choose a JPG, PNG, or WebP photo under 4 MB.')
        e.target.value = ''
        return
      }
      setFile(selectedFile)
      setVerificationResult(null)
      setVerificationStatus('idle')
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleVerify = async () => {
    if (!file) return

    setVerificationStatus('verifying')
    
    try {
      const dataUrl = await readFileAsBase64(file)
      const response = await fetch('/api/mobile/verify', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl.split(',')[1], mimeType: file.type,
          selectedTypes: ['Plastic', 'Paper', 'Organic', 'Metal', 'Glass', 'Other'], language: 'en',
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Photo verification failed.')
      if (!result.isWaste || !Array.isArray(result.wasteTypes) || !result.estimatedAmount || !result.verificationToken) {
        throw new Error(result.notes || 'This image did not show verifiable waste.')
      }
      setVerificationResult(result)
      setVerificationStatus('success')
      setNewReport(current => ({ ...current, type: result.wasteTypes.join(', '), amount: result.estimatedAmount }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Photo verification failed.')
      setVerificationStatus('failure');
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationStatus !== 'success' || !user || !file || !verificationResult) {
      toast.error('Please verify the waste before submitting or log in.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      let gps = coordinates
      if (!gps) {
        if (!navigator.geolocation) throw new Error('GPS is not available on this device.')
        gps = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            () => reject(new Error('Allow location access to submit a pickup report.')),
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
          )
        })
      }
      const dataUrl = await readFileAsBase64(file)
      const response = await fetch('/api/web/reports', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: newReport.location, ...gps, imageBase64: dataUrl.split(',')[1], mimeType: file.type, verificationResult,
        }),
      })
      const report = await response.json()
      if (!response.ok) throw new Error(report.error || 'Could not submit your report.')
      
      const formattedReport = {
        id: report.id,
        location: report.location,
        wasteType: report.wasteType,
        amount: report.amount,
        createdAt: new Date(report.createdAt).toISOString().split('T')[0]
      };
      
      setReports([formattedReport, ...reports]);
      setNewReport({ location: '', type: '', amount: '' });
      setCoordinates(null)
      setFile(null);
      setPreview(null);
      setVerificationStatus('idle');
      setVerificationResult(null);

      try {
        const accountResponse = await fetch('/api/web/account', { cache: 'no-store', credentials: 'include' })
        if (accountResponse.ok) {
          const account = await accountResponse.json()
          window.dispatchEvent(new CustomEvent('balanceUpdated', { detail: account.balance }))
        }
      } catch {}

      toast.success(`Report submitted successfully! You've earned 10 points for reporting waste.`);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!guardEmail) return
    const loadUser = async () => {
      try {
        const [accountResponse, reportsResponse] = await Promise.all([
          fetch('/api/web/account', { cache: 'no-store', credentials: 'include' }),
          fetch('/api/web/reports', { cache: 'no-store', credentials: 'include' }),
        ])
        const account = await accountResponse.json()
        const recentReports = await reportsResponse.json()
        if (!accountResponse.ok || !reportsResponse.ok) throw new Error(account.error || (recentReports as { error?: string }).error || 'Could not load your reports.')
        setUser(account.user)
        const formattedReports = recentReports.map((report: { id: number; location: string; wasteType: string; amount: string; createdAt: string }) => ({
        ...report,
        createdAt: new Date(report.createdAt).toISOString().split('T')[0]
      }))
      setReports(formattedReports)
      } catch (error) { toast.error(error instanceof Error ? error.message : 'Could not load your reports.') }
    }
    loadUser()
  }, [guardEmail])

  // Auth checking — show spinner while loading
  if (checking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">Report waste</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg mb-12">
        <div className="mb-8">
          <label htmlFor="waste-image" className="block text-lg font-medium text-gray-700 mb-2">
            Upload Waste Image
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-green-500 transition-colors duration-300">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="waste-image"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
                >
                  <span>Upload a file</span>
                  <input id="waste-image" name="waste-image" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">JPG, PNG, or WebP up to 4 MB</p>
            </div>
          </div>
        </div>
        
        {preview && (
          <div className="mt-4 mb-8">
            <Image src={preview} alt="Waste preview" width={960} height={720} unoptimized className="max-w-full h-auto rounded-xl shadow-md" />
          </div>
        )}
        
        <Button 
          type="button" 
          onClick={handleVerify} 
          className="w-full mb-8 bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg rounded-xl transition-colors duration-300" 
          disabled={!file || verificationStatus === 'verifying'}
        >
          {verificationStatus === 'verifying' ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Verifying...
            </>
          ) : 'Verify Waste'}
        </Button>

        {verificationStatus === 'success' && verificationResult && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-8 rounded-r-xl">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-green-800">Verification Successful</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Waste Type: {verificationResult.wasteTypes.join(', ')}</p>
                  <p>Quantity: {verificationResult.estimatedAmount}</p>
                  <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              value={newReport.location}
              onChange={handleInputChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter pickup address or landmark"
            />
            <LocationPicker value={coordinates} onChange={setCoordinates} />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">Waste Type</label>
            <input
              type="text"
              id="type"
              name="type"
              value={newReport.type}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified waste type"
              readOnly
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Estimated Amount</label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={newReport.amount}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder="Verified amount"
              readOnly
            />
          </div>
        </div>
        <Button 
          type="submit" 
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg rounded-xl transition-colors duration-300 flex items-center justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              Submitting...
            </>
          ) : 'Submit Report'}
        </Button>
      </form>

      <h2 className="text-3xl font-semibold mb-6 text-gray-800">Recent Reports</h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <MapPin className="inline-block w-4 h-4 mr-2 text-green-500" />
                    {report.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.wasteType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
