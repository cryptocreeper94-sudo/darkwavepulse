import { useState } from 'react'

export default function BugReportModal({ isOpen, onClose }) {
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Bug Report Submitted:', description)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setDescription('')
      onClose()
    }, 2000)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <span className="modal-icon">🐛</span>
          <h2 className="modal-title">Report a Bug</h2>
        </div>

        {submitted ? (
          <div className="modal-success">
            <span className="success-icon">✓</span>
            <p>Thank you! Your report has been submitted.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="bug-description">Describe the issue</label>
              <textarea
                id="bug-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what happened..."
                rows={5}
                required
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
