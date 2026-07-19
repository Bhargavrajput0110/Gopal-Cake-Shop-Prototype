# Non-Negotiable Business Rules

These rules protect the fundamental integrity of business data. They override any implementation convenience or UI requirement.

1. **Order Number**: Never changes once generated.
2. **Customer Phone**: Never reused or reassigned to a different profile.
3. **Timeline**: Never deleted. Every entry is immutable.
4. **Audit Log**: Never edited.
5. **QC Record**: Never overwritten. Successive QCs create new records.
6. **Payment**: Never modified after settlement. Any change requires a new transaction or a refund entry.
7. **Refund**: Always creates a new, distinct transaction linked to the original payment.
8. **Reference Images**: Never exposed publicly or indexed by search engines.
9. **Photo Cake Images**: Permanently deleted from storage after the strict retention period expires (to protect customer privacy).
10. **Catalog Images**: Never mixed with customer uploads. Media buckets are strictly partitioned.
