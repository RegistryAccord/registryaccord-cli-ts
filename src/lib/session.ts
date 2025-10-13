// src/lib/session.ts
// Session management for storing and retrieving JWT tokens with secure file permissions

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { FileSystemError } from './errors.js'

/**
 * Represents a user session with JWT token and metadata
 */
export type Session = {
  /** JWT token for authentication */
  jwt: string
  /** Token expiration timestamp in ISO format */
  expiry: string
  /** Audience for which this token is valid */
  aud: string
  /** When the token was issued in ISO format */
  issuedAt: string
  /** DID of the user this session belongs to */
  did: string
}

/**
 * Storage structure for multiple sessions keyed by audience
 */
export type SessionStore = {
  [aud: string]: Session
}

/**
 * Path to the session file in the user's home directory
 * File permissions are set to 0o600 (read/write for owner only)
 */
const SESSION_FILE = path.join(os.homedir(), '.registryaccord', 'session.json')

/**
 * Store a session in the session file
 * 
 * This function:
 * 1. Ensures the .registryaccord directory exists with secure permissions (0o700)
 * 2. Reads existing sessions from the file
 * 3. Adds or updates the provided session
 * 4. Writes all sessions back to the file with secure permissions (0o600)
 * 
 * @param session - The session to store
 * @throws FileSystemError if there are file system permission issues
 */
export function storeSession(session: Session): void {
  try {
    // Ensure directory exists with secure permissions
    const dir = path.dirname(SESSION_FILE)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { mode: 0o700 })
    } else {
      // Ensure existing directory has correct permissions
      fs.chmodSync(dir, 0o700)
    }
    
    // Read existing sessions
    let sessions: SessionStore = {}
    if (fs.existsSync(SESSION_FILE)) {
      const content = fs.readFileSync(SESSION_FILE, 'utf8')
      sessions = JSON.parse(content)
    }
    
    // Store new session
    sessions[session.aud] = session
    
    // Write back to file with secure permissions
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2), { mode: 0o600 })
  } catch (err) {
    // Throw FileSystemError with more context
    throw new FileSystemError(`Failed to store session for ${session.aud}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * Retrieve a session for a specific audience
 * 
 * @param aud - The audience to retrieve session for
 * @returns Session if found and valid, null otherwise
 */
export function getSession(aud: string): Session | null {
  if (!fs.existsSync(SESSION_FILE)) {
    return null
  }
  
  try {
    const content = fs.readFileSync(SESSION_FILE, 'utf8')
    const sessions: SessionStore = JSON.parse(content)
    return sessions[aud] || null
  } catch (err) {
    // Silently fail and return null - file might be corrupted
    return null
  }
}

/**
 * Get the current active session (first available)
 * 
 * @returns Session info if found, null otherwise
 */
export function getCurrentSession(): { did: string; expiry: string; active: boolean } | null {
  if (!fs.existsSync(SESSION_FILE)) {
    return null
  }
  
  try {
    const content = fs.readFileSync(SESSION_FILE, 'utf8')
    const sessions: SessionStore = JSON.parse(content)
    
    // Find the first session
    const auds = Object.keys(sessions)
    if (auds.length === 0) {
      return null
    }
    
    const session = sessions[auds[0]]
    return {
      did: session.did,
      expiry: session.expiry,
      active: new Date(session.expiry).getTime() > Date.now()
    }
  } catch (err) {
    // Silently fail and return null - file might be corrupted
    return null
  }
}
