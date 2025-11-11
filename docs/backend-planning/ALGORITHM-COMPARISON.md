# Algorithm Comparison: Container Recommendation Strategies

**Goal:** Evaluate different algorithmic approaches for packing products into containers.

---

## Algorithm 1: Greedy First-Fit (Simple)

### How It Works
```
1. Sort all products by order_by_date (earliest first)
2. Start filling Container #1
3. Add products one by one until container is full (76m³)
4. Start Container #2, repeat
5. Fill last container to 100% with more of first product
```

### Example
Products: A (120m³, Jan 8), B (95m³, Jan 10), C (60m³, Jan 12), D (40m³, Feb 15)

```
Container #1 (Jan 8):  76m³ A
Container #2 (Jan 8):  44m³ A + 32m³ B
Container #3 (Jan 10): 63m³ B + 13m³ C
Container #4 (Jan 12): 47m³ C + 29m³ D
Container #5 (Feb 15): 11m³ D + 65m³ filler
```

### Pros
- ✅ Dead simple to implement
- ✅ Fast (O(n) time)
- ✅ Predictable behavior
- ✅ No complex math

### Cons
- ❌ No parallel replenishment (Product A fills 2 containers before B starts)
- ❌ Creates containers with mixed urgencies (Container #4 has Jan 12 + Feb 15 products)
- ❌ May require large filler amounts

### Best For
- Small customer with 3-5 products
- Products all have similar urgency
- Simplicity > optimization

---

## Algorithm 2: Clustering + Round-Robin (Balanced)

### How It Works
```
1. Sort products by order_by_date
2. Find gaps >2 weeks, create clusters
3. For each cluster:
   - Calculate total volume, containers needed
   - Distribute products evenly (round-robin) across containers
   - All containers in cluster share same order_by_date
4. Fill each container to exactly 100%
```

### Example
Same products, but clustered:
- Cluster 1 (Jan 8-12): A, B, C = 275m³ = 3.6 containers
- Cluster 2 (Feb 15): D = 40m³ = 0.5 containers

```
Container #1 (Jan 8): 33m³ A, 26m³ B, 17m³ C
Container #2 (Jan 8): 33m³ A, 26m³ B, 17m³ C
Container #3 (Jan 8): 33m³ A, 26m³ B, 17m³ C
Container #4 (Jan 8): 21m³ A, 17m³ B, 9m³ C, 29m³ A (filler)
Container #5 (Feb 15): 40m³ D, 36m³ filler
```

### Pros
- ✅ Parallel replenishment within clusters
- ✅ Clean urgency separation (no mixed deadlines)
- ✅ Balanced product distribution
- ✅ Reasonably simple

### Cons
- ❌ More complex than greedy
- ❌ Filler problem in last container of each cluster
- ❌ Gap threshold (2 weeks) is arbitrary

### Best For
- Medium customers with 10-20 products
- Products with varied urgencies
- Want parallel replenishment

---

## Algorithm 3: Bin Packing Optimization (Optimal)

### How It Works
```
Use linear programming / optimization solver:

Minimize:
  - Number of containers
  - Total over-ordering
  - Urgency mixing penalty

Subject to:
  - Each product gets minimum volume needed
  - Each container = exactly 76m³
  - Products can split across containers

This finds mathematically optimal packing.
```

### Example
Solver finds best combination that minimizes waste and maximizes diversification.

### Pros
- ✅ Mathematically optimal solution
- ✅ Can handle complex constraints
- ✅ Minimizes over-ordering
- ✅ Can add custom weights/preferences

### Cons
- ❌ Very complex to implement
- ❌ Slow (may need seconds to compute)
- ❌ Requires optimization library
- ❌ Hard to explain to users
- ❌ Overkill for this problem

### Best For
- Large enterprises with 100+ products
- When minimizing cost is critical
- Have engineering resources for maintenance

---

## Algorithm 4: Time-Slice Batching (Predictable)

### How It Works
```
Create fixed time windows (every 4 weeks):
  - Window 1: Week 8-12
  - Window 2: Week 12-16
  - Window 3: Week 16-20
  - Window 4: Week 20-24

For each window:
  - Find products needing delivery in that window
  - Pack greedily into containers
  - All containers labeled for that window's deadline
```

### Example
```
Container #1 (Window 1: Week 8-12): Products A, B, C
Container #2 (Window 2: Week 12-16): Products D, E
Container #3 (Window 3: Week 16-20): Products F, G, H
```

### Pros
- ✅ Very predictable schedule
- ✅ Easy to explain to customers
- ✅ Consistent cadence (every 4 weeks)
- ✅ Simple to implement

### Cons
- ❌ Artificial boundaries (product needing order on Week 11.9 vs 12.1 go in different windows)
- ❌ May delay urgent products
- ❌ Fixed windows don't adapt to actual urgency

### Best For
- Customers who want predictable ordering schedule
- Regular replenishment patterns
- When simplicity > precision

---

## Algorithm 5: Two-Phase Hybrid (Sophisticated)

### How It Works
```
Phase 1: Critical Products (order_by_date < 2 weeks)
  - Pack greedily, prioritize urgency
  - Fill containers fast, don't optimize
  - Goal: prevent stockouts

Phase 2: Planned Products (order_by_date > 2 weeks)
  - Use clustering + round-robin
  - Optimize for diversification
  - Goal: efficient long-term planning

Combine outputs.
```

### Example
```
Phase 1 containers (URGENT):
  Container #1 (Jan 8): Products A, B (greedy pack)

Phase 2 containers (PLANNED):
  Container #2 (Feb 15): 25m³ each of C, D, E (round-robin)
  Container #3 (Mar 15): 25m³ each of F, G, H (round-robin)
```

### Pros
- ✅ Handles urgency well
- ✅ Optimizes long-term planning
- ✅ Best of both worlds
- ✅ Adapts to situation

### Cons
- ❌ More complex logic
- ❌ Two different algorithms to maintain
- ❌ Transition point (2 weeks) is arbitrary

### Best For
- Dynamic inventory situations
- Mix of stable + volatile products
- Want sophistication without full optimization

---

## Comparison Matrix

| Algorithm | Complexity | Speed | Diversification | Urgency Handling | Over-Order % | Best For |
|-----------|-----------|-------|-----------------|------------------|--------------|----------|
| **Greedy First-Fit** | Simple | Fast | Poor | Good | High | Small customers |
| **Clustering + Round-Robin** | Medium | Fast | Good | Excellent | Medium | Most customers |
| **Bin Packing Optimization** | Very Hard | Slow | Optimal | Excellent | Minimal | Enterprises |
| **Time-Slice Batching** | Simple | Fast | Medium | Poor | Medium | Predictable needs |
| **Two-Phase Hybrid** | Hard | Fast | Good | Excellent | Low | Dynamic inventory |

---

## Evaluation Metrics

To choose the best algorithm, we should test on real data and measure:

### 1. Stockout Prevention (Most Important)
- % of products that would stock out before delivery
- Lower = better
- Target: 0%

### 2. Over-Ordering Rate
- (Total ordered - Total needed) / Total needed
- Lower = better
- Target: <10%

### 3. Diversification Score
- Average products per container
- Higher = better (parallel replenishment)
- Target: 3-5 products/container

### 4. Container Count
- Total containers generated
- More containers = more revenue
- But too many = overwhelming

### 5. Urgency Consistency
- % of containers with mixed urgency levels
- Lower = better (cleaner grouping)
- Target: <20%

---

## Recommendation

**For MVP (first version):**
→ **Algorithm 2: Clustering + Round-Robin**

**Why:**
- Good balance of simplicity vs optimization
- Handles urgency well
- Achieves parallel replenishment
- Easy to explain to customers
- Can be implemented in ~200 lines of code

**For Future (if needed):**
→ **Algorithm 5: Two-Phase Hybrid**

If customers have very dynamic inventory with frequent emergencies, upgrade to hybrid approach.

---

## Next Steps

1. Implement Algorithm 2 (Clustering + Round-Robin)
2. Test with 3 real customer datasets
3. Measure all 5 metrics
4. Compare against baseline (Greedy)
5. Iterate based on results

If Algorithm 2 doesn't perform well, pivot to Algorithm 5.

---

## Open Questions

1. **Gap threshold for clustering:** 1 week? 2 weeks? 4 weeks?
2. **Filler product selection:** First? Most urgent? Highest consumption?
3. **Maximum over-order limit:** 50%? 100%? Unlimited?
4. **Pull-forward threshold:** When to pull next cluster's products early?

