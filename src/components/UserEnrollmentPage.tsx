import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { Check, ImagePlus, Info, LoaderCircle, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import {
  createHouseholdMember,
  deleteHouseholdMember,
  getHouseholdMemberPhoto,
  listHouseholdMembers,
  type EnrollmentStatus,
  type HouseholdMemberRecord,
} from '../services/enrollmentService'

const maxPhotoBytes = 5 * 1024 * 1024
const statusLabels: Record<EnrollmentStatus, string> = {
  pending: 'Pending face processing',
  processing: 'Face processing',
  enrolled: 'Enrolled',
  failed: 'Processing failed',
}

function PhotoThumbnail({ token, member }: { token: string; member: HouseholdMemberRecord }) {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let current = true
    let objectUrl: string | null = null
    getHouseholdMemberPhoto(token, member.member_id).then((blob) => {
      if (!current) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    }).catch(() => {
      if (current) setFailed(true)
    })
    return () => {
      current = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [member.member_id, token])

  return url
    ? <img className="enrollment-member-photo" src={url} alt={`${member.name} enrollment photo`} />
    : <span className="enrollment-member-photo-placeholder" aria-label={failed ? 'Photo unavailable' : 'Photo loading'}><UserRound size={20} /></span>
}

export function UserEnrollmentPage() {
  const [token, setToken] = useState('')
  const [connectedToken, setConnectedToken] = useState('')
  const [members, setMembers] = useState<HouseholdMemberRecord[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState('')
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState('')

  const previewUrl = useMemo(() => {
    if (!photo) return null
    return URL.createObjectURL(photo)
  }, [photo])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  async function loadMembers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = token.trim()
    if (!value) return
    setMembersLoading(true)
    setMembersError('')
    setSuccessMessage('')
    try {
      const records = await listHouseholdMembers(value)
      setMembers(records)
      setConnectedToken(value)
    } catch (error) {
      setConnectedToken('')
      setMembers([])
      setMembersError(error instanceof Error ? error.message : 'Could not load household members.')
    } finally {
      setMembersLoading(false)
    }
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0] ?? null
    setPhoto(null)
    setPhotoError('')
    setSubmitError('')
    if (!selected) return
    if (!['image/jpeg', 'image/png'].includes(selected.type)) {
      setPhotoError('Choose a JPEG or PNG image.')
      event.currentTarget.value = ''
      return
    }
    if (selected.size > maxPhotoBytes) {
      setPhotoError('The photo must be 5 MB or smaller.')
      event.currentTarget.value = ''
      return
    }
    setPhoto(selected)
  }

  async function submitEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!photo || connectedToken !== token.trim()) return
    setSubmitting(true)
    setSubmitError('')
    setSuccessMessage('')
    try {
      const record = await createHouseholdMember(connectedToken, name.trim(), photo)
      setMembers((current) => [record, ...current])
      setName('')
      setPhoto(null)
      const input = document.getElementById('enrollment-photo') as HTMLInputElement | null
      if (input) input.value = ''
      setSuccessMessage(`${record.name}’s photo was stored. Enrollment status: ${statusLabels[record.enrollment_status]}. Face processing is not connected.`)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'The member could not be enrolled.')
    } finally {
      setSubmitting(false)
    }
  }

  async function removeMember(member: HouseholdMemberRecord) {
    if (deletingMemberId !== member.member_id) {
      setDeletingMemberId(member.member_id)
      setDeleteError('')
      return
    }
    setDeleteError('')
    try {
      await deleteHouseholdMember(connectedToken, member.member_id)
      setMembers((current) => current.filter((item) => item.member_id !== member.member_id))
      setDeletingMemberId(null)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'The member could not be deleted.')
    }
  }

  const authorized = connectedToken !== '' && connectedToken === token.trim()

  return <section className="panel user-enrollment-panel">
    <div className="panel-heading">
      <div><h2>User Enrollment</h2><p>Upload a household member photo for pending face-processing enrollment.</p></div>
      <span className="demo-chip">BACKEND REQUIRED</span>
    </div>
    <div className="enrollment-security-note"><ShieldCheck size={16} /><p>Photos are sent to the authenticated local backend and stored privately outside public web assets. This development token is not user identity or production authorization.</p></div>
    <form className="enrollment-connect-form" onSubmit={loadMembers}>
      <label className="field-label">Development bearer token
        <input type="password" autoComplete="off" value={token} onChange={(event) => {
          setToken(event.target.value)
          setConnectedToken('')
          setMembers([])
          setMembersError('')
        }} aria-label="Development bearer token" placeholder="Enter the token configured in backend/.env" />
      </label>
      <button className="secondary-button" type="submit" disabled={!token.trim() || membersLoading}>
        {membersLoading ? <LoaderCircle size={14} className="enrollment-spinner" /> : null}
        {membersLoading ? 'Connecting…' : 'Connect to enrollment API'}
      </button>
    </form>
    {membersError && <p className="enrollment-error" role="alert">{membersError}</p>}
    {successMessage && <p className="enrollment-success" role="status"><Check size={14} />{successMessage}</p>}
    {authorized && <>
      <form className="enrollment-upload-form" onSubmit={submitEnrollment}>
        <label className="field-label">Household member name
          <input autoComplete="name" maxLength={80} required value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter member name" />
        </label>
        <label className="field-label">Face photo (JPEG or PNG, up to 5 MB)
          <input id="enrollment-photo" type="file" accept="image/jpeg,image/png" aria-label="Face photo" onChange={selectPhoto} />
        </label>
        {photoError && <p className="enrollment-error" role="alert">{photoError}</p>}
        {previewUrl && photo && <div className="enrollment-photo-preview"><img src={previewUrl} alt={`Selected photo preview for ${name || 'household member'}`} /><div><strong>{photo.name}</strong><span>Preview only · not uploaded yet</span></div></div>}
        {submitError && <p className="enrollment-error" role="alert">{submitError}</p>}
        <button className="primary-button" type="submit" disabled={!name.trim() || !photo || submitting}>
          {submitting ? <LoaderCircle size={15} className="enrollment-spinner" /> : <ImagePlus size={15} />}
          {submitting ? 'Uploading photo…' : 'Upload photo and create pending enrollment'}
        </button>
      </form>
      <div className="enrollment-status-note"><Info size={15} /><p>Photo upload creates a <strong>pending</strong> record only. This app does not generate face embeddings or confirm recognition.</p></div>
      <div className="enrollment-member-list">
        <div className="enrollment-list-heading"><h3>Household members</h3><span>{members.length}</span></div>
        {membersLoading ? <p className="enrollment-list-message">Loading members…</p>
          : members.length === 0 ? <p className="enrollment-list-message">No enrolled members are stored on this backend yet.</p>
            : members.map((member) => <article className="enrollment-member-row" key={member.member_id}>
              <PhotoThumbnail token={connectedToken} member={member} />
              <div className="enrollment-member-copy"><strong>{member.name}</strong><span className={`enrollment-status enrollment-status-${member.enrollment_status}`}>{statusLabels[member.enrollment_status]}</span>{member.status_message && <small>{member.status_message}</small>}</div>
              <button className="secondary-button enrollment-delete-button" type="button" onClick={() => removeMember(member)} aria-label={deletingMemberId === member.member_id ? `Confirm delete ${member.name}` : `Delete ${member.name}`}>
                <Trash2 size={14} />{deletingMemberId === member.member_id ? 'Confirm delete' : 'Delete'}
              </button>
            </article>)}
        {deleteError && <p className="enrollment-error" role="alert">{deleteError}</p>}
      </div>
    </>}
  </section>
}
