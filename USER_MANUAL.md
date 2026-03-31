# User Manual — Video Upload, Sensitivity Processing & Streaming Platform

## Getting Started

### 1. Register an Account

1. Open the app at **http://localhost:5173**
2. Click **Register** on the login page
3. Fill in:
   - **Name** — your display name
   - **Email** — unique email address
   - **Password** — minimum 6 characters
   - **Organization ID** — a shared identifier for your team (e.g. `acme-corp`). All users in the same organization share access based on their role
   - **Role** — choose `editor` to upload videos, or `viewer` to watch assigned videos
4. Click **Register**. You are logged in automatically.

### 2. Login

1. Enter your **Email** and **Password**
2. Click **Login**. Your session is stored until you log out.

---

## Roles & Permissions

| Role | What You Can Do |
|------|-----------------|
| **Viewer** | Watch videos that have been assigned to you |
| **Editor** | Upload, manage, and assign videos within your org |
| **Admin** | All editor permissions + manage user roles org-wide |

---

## Uploading a Video (Editor / Admin)

1. Click **Upload** in the top navigation or from the Dashboard
2. Enter a **Title** (optional — defaults to the filename)
3. Enter a **Description** (optional — up to 1000 characters)
4. Drag & drop a video file onto the upload zone, or click to browse
   - Supported formats: MP4, MOV, AVI, MKV, WebM
   - Maximum size: **100 MB**
5. Click **Upload & Process**
6. Watch the **upload progress bar** fill as the file transfers
7. Once uploaded, the **processing phase** begins automatically:
   - A second progress bar shows sensitivity analysis progress (0% → 100%)
   - Real-time updates are pushed via Socket.io — no need to refresh
8. When complete, you'll see the **classification result**:
   - ✅ **Safe** — content passed sensitivity checks
   - 🚩 **Flagged** — content flagged for review
9. Click **View Video** to go to the video player, or **Upload Another** to upload more

---

## Video Library

The **Library** page lists all your videos (or assigned videos for viewers).

### Filters
| Filter | Options |
|--------|---------|
| **Status** | All / Processing / Completed / Failed |
| **Content** | All / ✅ Safe / 🚩 Flagged / ⏳ Pending |
| **Search** | Type to filter by title or filename |
| **Sort by** | Upload Date / File Size / Title |
| **Sort direction** | ↓ Desc / ↑ Asc |

Click any video card to open the player page.

---

## Watching a Video

1. Click a video in the Library (only **completed** videos can be played)
2. The built-in player uses **HTTP range requests** — you can seek to any point without buffering the whole file
3. Below the player you'll see video metadata: filename, size, type, status, uploader

---

## Content Review (Editor / Admin)

On the video player page, editors and admins see a **🔍 Content Review** panel:

- **Mark as Safe** — override a flagged classification to safe
- **Mark as Flagged** — override a safe classification to flagged

This is useful when the automated analysis produces an incorrect result.

---

## Assigning Videos to Viewers (Editor / Admin)

Viewers can only watch videos that have been explicitly assigned to them.

1. Open a video (as editor or admin)
2. Scroll to **👥 Video Access — Assign to Viewers**
3. **Admins** see a dropdown of all users in their organization
4. **Editors** can type a User ID to assign
5. Click **Assign**
6. To remove access, click the **✕** next to the viewer's name

---

## Dashboard

The Dashboard shows:
- **Total Videos** — all videos in your account
- **Processing** — videos currently being analyzed
- **Safe** — classified safe videos
- **Flagged** — flagged videos needing review
- **Recent Videos** — last 5 uploaded with live status

---

## Admin — User Management

Admins have access to a **Users** page (via the avatar menu):

1. View all users in your organization
2. Change a user's **role** (viewer / editor / admin) using the dropdown
3. Changes take effect on the user's next API request

---

## Logging Out

Click **Logout** in the top navigation. Your session token is cleared locally.

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| "Access denied" on video player | The video hasn't been assigned to you. Ask an editor/admin to assign it. |
| Upload fails | Check file format (must be video/*) and size (max 100 MB) |
| Video stuck at "Processing" | Refresh the page — real-time updates require a live Socket.io connection |
| Login fails | Double-check email/password. Passwords are case-sensitive. |
| Can't see any users in assign dropdown | Ensure the viewers are registered under the same Organization ID |
