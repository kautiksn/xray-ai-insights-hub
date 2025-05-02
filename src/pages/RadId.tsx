import { getRecords } from '@/services'
import { useEffect, useRef } from 'react'
import { redirect, useNavigate, useParams } from 'react-router'

function RadId() {
  // const { radId: _radId } = useParams()
  const radIdRef = useRef(null)
  const navigate = useNavigate()

  function redirectToRecords() {
    console.log(radIdRef.current.value)
  }

  useEffect(() => {
    function captureEnterKeyDown() {
      radIdRef.current?.addEventListener('keydown', (e) => {
        if (e.code === 'Enter') {
          const radId = radIdRef.current.value.trim()
          if (radId !== '') {
            const URL = `/rad/${radIdRef.current.value}`
            navigate(URL)
          }
        }
      })
    }

    captureEnterKeyDown()
  }, [])

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex items-center bg-gray-900 text-white border border-gray-700 rounded-lg pl-4 w-72 overflow-hidden">
        <input
          type="text"
          placeholder="Enter your Id"
          ref={radIdRef}
          className="py-2 bg-transparent flex-grow outline-none text-sm placeholder-gray-400"
        />

        <button onClick={redirectToRecords} className="h-10 bg-gray-700">
          <svg
            className="w-8 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default RadId
