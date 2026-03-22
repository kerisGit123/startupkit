Based on your pattern, here's the JSON for the 1K, 2K, 4K pricing:

```json
{
  "pricing": {
    "base_cost": 8,
    "qualities": [
      {
        "name": "1K",
        "cost": 8
      },
      {
        "name": "2K",
        "cost": 12
      },
      {
        "name": "4K",
        "cost": 18
      }
    ]
  }
}
```

To answer your question: **4K = 18**

It looks like you have a pattern where:
- 1K = base cost (8)
- 2K = base cost + 4 (12)
- 4K = base cost + 10 (18)

Or alternatively, if you prefer a key-value format:

```json
{
  "pricing": {
    "1K": 8,
    "2K": 12,
    "4K": 18
  }
}
```

Is this what you were looking for? Also, I noticed you mentioned "3K" in your text but then listed "4K" in the pricing - would you like me to include 3K as well with a calculated price?