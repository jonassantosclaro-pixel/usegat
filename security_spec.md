# Security Specification for Use Gat

## Data Invariants
1. Products can only be created, updated, or deleted by Administrators.
2. Orders belong to a User and can only be read by the owner or an Admin.
3. Users can only edit their own profile (except for `isAdmin` field which is Admin-only).
4. Settings can only be edited by Administrators.
5. All IDs must match standard patterns.
6. Timestamps should be server-side validated where possible.

## The Dirty Dozen Payloads
1. Create a product as a regular user (Denied)
2. Update a product's price as a regular user (Denied)
3. Read another user's order (Denied)
4. Update an order's status as a regular user (Denied)
5. Set `isAdmin: true` on your own profile (Denied)
6. Delete a product as a regular user (Denied)
7. Create an order for another user ID (Denied)
8. Update `settings` as a regular user (Denied)
9. Inject 1MB string into product name (Denied)
10. Read all users list as a regular user (Denied)
11. Create a product with missing required fields (Denied)
12. Update a user profile you don't own (Denied)
