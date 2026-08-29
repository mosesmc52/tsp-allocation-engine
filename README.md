# tsp-allocation-engine
Allocation recommendation engine for TSP

Run one allocation iteration with:

```bash
python algo.py
```

The normal run window is the first seven days of each month. Set
`FORCE_REBALANCE=true` to bypass the window. Configure SES in `.env` with
`AWS_SES_REGION_NAME`, `AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY`,
`FROM_ADDRESS`, and comma-separated `TO_ADDRESSES`.
Set `EMAIL_POSITIONS=false` to disable email delivery while still calculating
the allocation; it defaults to `true`.
