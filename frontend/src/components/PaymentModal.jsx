import React, { useState } from 'react'
import { X, CreditCard, Shield, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const PaymentModal = ({ type, onClose, onSuccess }) => {
  const [paymentCode, setPaymentCode] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const getPaymentDetails = () => {
    switch (type) {
      case 'gender':
        return {
          title: 'Gender Filter Plan',
          description: 'Connect with users based on gender preference',
          amount: '₹10',
          duration: '1 day',
          features: [
            'Filter by male users',
            'Filter by female users',
            'Premium matching algorithm',
            'Priority connection'
          ]
        }
      case 'room':
        return {
          title: 'Chat Room Access',
          description: 'Join group chat rooms with multiple people',
          amount: '₹5',
          duration: 'per room',
          features: [
            'Join group chat rooms',
            'Multiple participants',
            'Room-based conversations',
            'Enhanced social experience'
          ]
        }
      default:
        return {
          title: 'Free Chat',
          description: 'Connect with random people instantly',
          amount: 'Free',
          duration: 'unlimited',
          features: [
            'Random matching',
            'Anonymous chatting',
            'No registration required',
            'Instant connection'
          ]
        }
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    
    if (type === 'free') {
      onSuccess()
      return
    }

    if (!paymentCode.trim()) {
      toast.error('Please enter the payment code')
      return
    }

    if (paymentCode !== 'pass') {
      toast.error('Invalid payment code. Use "pass" for testing.')
      return
    }

    setIsProcessing(true)
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false)
      setIsSuccess(true)
      toast.success('Payment successful!')
      
      setTimeout(() => {
        onSuccess()
      }, 2000)
    }, 2000)
  }

  const details = getPaymentDetails()

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-6">
            Your payment has been processed successfully. You can now access the premium features.
          </p>
          <button
            onClick={onSuccess}
            className="btn-primary w-full"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{details.title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {details.amount}
              </div>
              <div className="text-sm text-gray-600">
                {details.duration}
              </div>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">{details.description}</p>
          
          <div className="space-y-2">
            {details.features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                <span className="text-sm text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {type !== 'free' && (
          <form onSubmit={handlePayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Code (Testing)
              </label>
              <input
                type="text"
                value={paymentCode}
                onChange={(e) => setPaymentCode(e.target.value)}
                placeholder="Enter 'pass' for testing"
                className="input-field"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                For testing purposes, use "pass" as the payment code
              </p>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4" />
              <span>Secure payment processing</span>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay {details.amount}
                </div>
              )}
            </button>
          </form>
        )}

        {type === 'free' && (
          <button
            onClick={handlePayment}
            className="btn-primary w-full"
          >
            Start Free Chat
          </button>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By proceeding, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal 