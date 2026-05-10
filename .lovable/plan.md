## Owner-to-Owner Collaboration System

Add a professional collaboration layer so owners can grant other owners (Manager / Viewer) access to a specific property, while keeping the existing renter→owner connection flow untouched.

---

### 1. Database (new migration)

**New table: `property_collaborators`**
- `property_id` (uuid) — scopes access to one property
- `owner_id` (uuid) — the property owner who granted access
- `collaborator_id` (uuid) — the invited owner
- `role` (enum: `manager`, `viewer`)
- `status` (text: `pending`, `accepted`, `declined`, `revoked`)
- `invited_by` (uuid)
- `created_at`, `updated_at`
- Unique constraint on (`property_id`, `collaborator_id`)

**New enum:** `collaborator_role` = (`manager`, `viewer`)

**Helper function:** `has_property_access(property_id, user_id)` returns `role` text — used by RLS / UI.

**RPCs:**
- `send_collaboration_request(p_property_public_id text)` → validates sender is an owner, target public_id maps to a property, prevents self-invite & duplicates, inserts pending row.
- `respond_collaboration_request(p_request_id, p_action 'accept'|'decline', p_role collaborator_role)` → only target user; role required when accepting.
- `revoke_collaborator(p_request_id)` → only property owner.
- `get_my_collaborations()` → returns rows where I am owner or collaborator (with property + user info).

**RLS:** Each user can SELECT rows where they are `owner_id` or `collaborator_id`. Only target collaborator can UPDATE status/role on their own pending row. Only owner can revoke.

**Renter flow stays in `relationships` table — completely separate.**

---

### 2. Backend search detection

When a user enters a public_id in `UserSearch`:
- Existing `search_property_by_public_id` already returns a property. 
- If the **searcher is an owner**, the connect button calls `send_collaboration_request` instead of the renter `createRelationshipRequest`.
- If searcher is a renter, behavior is unchanged.

---

### 3. Frontend

**New files:**
- `src/services/collaborationService.ts` — wraps the RPCs.
- `src/hooks/usePropertyCollaborators.ts` — fetch + realtime for active property.
- `src/components/collaboration/RoleSelectionDialog.tsx` — modal shown when accepting an owner request, with two cards (Manager / Viewer) listing permissions.
- `src/components/collaboration/CollaboratorsList.tsx` — list of collaborators on the active property (owner view: revoke button).
- `src/components/collaboration/IncomingCollaborationCard.tsx` — pending owner-to-owner request card with Accept (opens role dialog) / Decline.

**Edited files:**
- `src/components/relationship/UserSearch.tsx` / `UserSearchResults.tsx` — when current user `isOwner`, send a collaboration request; show "Send Collaboration Request" label.
- `src/pages/Connections.tsx` (or owner connections tab) — add a new section "Property Collaborators" with two subsections: incoming owner requests, active collaborators. Renter requests remain untouched in their own section.
- `src/context/OwnerPropertyContext.tsx` — expose `myRoleOnActiveProperty` (`'owner' | 'manager' | 'viewer'`) so the UI can disable edit actions for viewers.
- Permission gating in:
  - `OwnerDashboard` (viewers see read-only)
  - Rent management, rooms, renters, notices, bookings, property edit pages — wrap mutating buttons with a `canEdit` check from a new `usePropertyPermissions()` hook.

**Permission rules**
| Action | Owner | Manager | Viewer |
|---|---|---|---|
| View dashboard / analytics | Yes | Yes | Yes |
| Manage rooms | Yes | Yes | No |
| Manage renters | Yes | Yes | No |
| Manage rent | Yes | Yes | No |
| Manage notices | Yes | Yes | No |
| Manage bookings | Yes | Yes | No |
| Edit property data | Yes | Yes | No |
| Invite / revoke collaborators | Yes | No | No |

---

### 4. UI/UX

- Role selection modal: two large cards with icon, role name, permission bullet list. Soft purple aesthetic, framer-motion fade/scale.
- Accept button disabled until a role is picked.
- Toast on success: "Collaborator added as Manager".
- Active collaborators list shows avatar, name, role badge, "Revoke" (owner only).
- Existing renter accept/decline UI is unchanged.

---

### Notes

- Strict separation: renter requests live in `relationships`, owner collaborations live in `property_collaborators`. No shared queries.
- All collaboration data is scoped by `activeProperty.id` so switching property updates the list instantly (consistent with existing per-property scoping).
- Existing room/rent/notice mutations will be permission-gated client-side; deeper server-side enforcement can be added later by extending RLS to consult `property_collaborators` (out of scope unless requested).
