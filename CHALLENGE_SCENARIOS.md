# SpanCraft Challenge Scenarios - Design Document

## Design Philosophy

**Core Principle:** All scenarios share the same poles, spans, and rules. They apply different pressures:
- Time
- Safety
- Budget
- Reputation
- Permanence

**We are not adding mechanics. We are rotating the spotlight.**

Each scenario uses the existing building and power systems but frames different problems that teach different aspects of grid management. This is textbook good design - the depth comes from context, not complexity.

---

## Scenario 1: Lightning Strike Pole Replacement

**Category:** Baseline / Tutorial  
**Complexity:** ⭐ Simple

### Trigger
- Sudden localized failure
- Clear fault origin
- Single obvious problem

### Player Work
1. **Isolate** - Identify the failed component
2. **Replace** - Remove damaged pole/span, rebuild
3. **Restore** - Reconnect and verify power flow

### What It Teaches
- Safe de-energization workflow
- Outage minimization techniques
- Clean reconnection procedures

### Design Notes
This is your "hello world" repair loop. Clean, simple, teaches the fundamental cycle of fault → diagnose → repair → restore. No ambiguity, no complex decisions - just learn the basic workflow.

### Success Criteria
- Power restored to customer
- Minimal additional outages during repair
- Work completed within time limit

### Scoring Factors
- Repair time (faster = better stars)
- Additional outages caused (fewer = better)
- Budget efficiency

---

## Scenario 2: Vegetation Clearance Inspection Failure

**Category:** Preventative Maintenance  
**Complexity:** ⭐⭐ Moderate

### Trigger
- Audit or inspection event
- Overgrown spans flagged as high risk
- No immediate failure (yet)

### Player Work
1. **Identify** risky spans (marked by inspection)
2. **Decide** whether to de-energize to clear safely
3. **Possibly reroute** temporarily during clearance
4. **Restore** with reduced risk ratings

### Twist: The Choice That Matters
**You can ignore flagged risks.** 

But ignored risks increase failure probability over time. The scenario continues running, and deferred maintenance eventually causes failures at the worst possible moments.

### What It Teaches
- **Maintenance vs reaction** - Proactive work costs money now, saves money later
- **Reading the grid as a living system** - Understanding risk accumulation
- **Tradeoff between planned and unplanned outages** - Short planned outage vs long emergency outage

### Design Notes
This scenario teaches players to think ahead *without forcing them*. It introduces consequences for inaction without being punitive. The scenario rewards systems thinking - players who understand risk curves will budget for clearance work.

Excellent for teaching that not all problems demand immediate solutions, but all problems demand eventual solutions.

### Success Criteria
- All critical risks addressed
- Grid remains stable
- No catastrophic failures from deferred maintenance

### Scoring Factors
- Risk reduction percentage
- Planned vs unplanned outage ratio
- Long-term stability (failures in later phase)

### Implementation Details
- Spans marked with risk levels (yellow/orange/red)
- Risk increases over time for ignored spans
- Random failure rolls for high-risk spans
- Decision UI: "Clear Now" vs "Defer" with risk forecast

---

## Scenario 3: New Customer Substation (Growth)

**Category:** Integration / Expansion  
**Complexity:** ⭐⭐⭐ Complex

### Trigger
- New industrial or residential demand
- Sudden draw request at a new node
- Existing customers must stay powered

### Player Work
1. **Extend the grid** to new customer location
2. **Ensure capacity** on existing infrastructure
3. **Possibly reinforce** upstream topology
4. **Avoid destabilizing** existing customers

### Failure Modes
- **Brownouts** - Insufficient capacity causes voltage drops
- **Cascading load failures** - Overloaded spans fail sequentially
- **Excessive outage during tie-in** - Taking down too much during connection

### What It Teaches
- **Load balancing** - Not every path can carry every load
- **Hierarchical design** - Why grid topology matters
- **Why not every pole should be a hub** - Centralization vs distribution

### Design Notes
This reframes expansion as *risk*, not just reward. Adding a customer isn't a simple "connect and done" - it's a systems integration problem. 

The scenario forces players to evaluate their existing grid topology and potentially rebuild portions to handle new load. It punishes hub-and-spoke designs with insufficient capacity planning.

### Success Criteria
- New customer powered
- All existing customers remain powered
- No overload conditions
- Budget maintained

### Scoring Factors
- Integration time
- Number of service interruptions during tie-in
- Capacity margin (how much headroom remains)
- Total cost of expansion

### Implementation Details
- Existing grid with multiple customers pre-powered
- New customer appears mid-scenario
- Conductor capacity limits (max load per span)
- Load calculation based on customer count per path
- Visual indicators for overload conditions

---

## Scenario 4: Replace Conductor with Converted Conductor

**Category:** Incremental Upgrade  
**Complexity:** ⭐⭐⭐ Complex

### Trigger
- Policy change (safety regulations)
- Safety upgrade mandate
- Fire risk mitigation order

### Player Work
1. **Replace spans selectively** with new conductor type
2. **Possibly segment the grid** to isolate work areas
3. **Work under time pressure** with partial energization

### Constraints
- **New conductor behaves differently** - Different properties
- **Different loss curve** - Performance characteristics
- **Different failure tolerance** - Safety margins

### What It Teaches
- **Not all edges are equal** - Conductor type matters
- **Incremental upgrades** - Can't replace everything at once
- **Mixed-state systems** - Managing transition periods

### Design Notes
This scenario is sneaky good because it is subtle and technical. It introduces the concept that not all connections are equivalent - the medium matters, not just the topology.

This is where your edge-based model shines. Players learn to think about infrastructure as having *properties*, not just presence/absence.

### Success Criteria
- All mandated spans upgraded to new conductor type
- Grid remains functional during transition
- No extended outages

### Scoring Factors
- Upgrade completion time
- Number of service interruptions
- Budget efficiency
- Transition smoothness (mixed-state duration)

### Implementation Details
- Multiple conductor types with different properties:
  - Cost
  - Capacity
  - Failure tolerance
  - Clearance requirements
- Marking system for spans requiring upgrade
- Selective replacement UI (not all spans need upgrading)
- Mixed conductor type support in power system

---

## Scenario 5: Targeted Undergrounding After Fire

**Category:** Long-term Investment  
**Complexity:** ⭐⭐⭐⭐ Very Complex

### Trigger
- Fire event (area marked as burned)
- Regulatory or public pressure
- Mandate to underground high-risk spans

### Player Work
1. **Decommission** overhead spans in fire zone
2. **Reroute temporarily** to maintain service
3. **Install underground equivalents** (slower, more expensive)
4. **Restore service** with changed topology

### Constraints
- **Underground work is slower** - Takes more time per span
- **Harder to modify later** - Permanent commitment
- **Fewer failure modes once done** - Higher reliability

### What It Teaches
- **Long-term investment thinking** - Pay more now for stability later
- **Topology permanence** - Some decisions are hard to reverse
- **Why some fixes are expensive but stabilizing** - Cost vs reliability tradeoff

### Design Notes
This is a high-stakes, long-term scenario. It forces players to think beyond the immediate problem and consider the permanent impact of their choices.

Underground infrastructure has different economics - higher upfront cost, lower maintenance, reduced failure probability. Perfect late-game scenario for advanced players.

### Success Criteria
- All mandated spans converted to underground
- Service maintained during conversion
- Budget managed despite high costs

### Scoring Factors
- Conversion completion rate
- Service interruption duration
- Budget performance (acknowledging high costs)
- Future reliability improvement

### Implementation Details
- "Fire zone" area marking
- Underground conductor type (different visual, properties)
- Higher cost multiplier for underground installation
- Slower placement time simulation
- Temporary rerouting requirement
- Long-term reliability benefits (tracked)

---

## Scenario 6: Emergency Backfeed During Upstream Failure

**Category:** Network Redundancy  
**Complexity:** ⭐⭐⭐⭐ Very Complex

### Trigger
- **Substation outage upstream** - Primary power source fails
- Customers still expect service
- Must find alternate path

### Player Work
1. **Identify alternate paths** through the network
2. **Reconfigure live grid** (switching operations)
3. **Avoid overloads** on alternate paths

### Risk
**Incorrect backfeed causes cascading failure** - Wrong reconfiguration can make things worse

### What It Teaches
- **Network redundancy** - Why redundant paths matter
- **Directionality without arrows** - Power flow concepts
- **Thinking in flow, not lines** - Network graph reasoning

### Design Notes
This rewards players who built smart earlier. If you built redundant paths with sufficient capacity, this scenario is straightforward. If you built a fragile tree topology, you'll struggle.

This is a *diagnostic* scenario - it tests your past decisions, not just your current skills.

### Success Criteria
- All customers powered from alternate source
- No overload failures
- Switching completed within time limit

### Scoring Factors
- Time to restore service
- Number of customers lost
- Grid stability during transition
- Efficiency of alternate path

### Implementation Details
- Pre-built grid with multiple substations
- Primary substation failure trigger (visual indicator)
- Multiple customers to keep powered
- Path capacity constraints
- Overload detection and cascading failure
- Switching UI for reconfiguration
- Rewards redundant topology from previous builds

---

## Scenario 7: Temporary Service for Construction/Events

**Category:** Ephemeral Topology  
**Complexity:** ⭐⭐ Moderate

### Trigger
- **Construction site** needs power for 6 months
- **Festival** needs temporary service
- **Emergency shelter** needs immediate power

### Player Work
1. **Provide temporary power** to new location
2. **Minimal disruption** to existing service
3. **Tear down later** cleanly

### What It Teaches
- **Ephemeral topology** - Not all infrastructure is permanent
- **Reversibility costs** - Cleanup takes effort and planning
- **Clean removal matters** - Abandoned infrastructure is technical debt

### Design Notes
Short-lived, awkward problems are very fun. This makes "undo" a real concept - players must think about not just building, but *un-building*.

The scenario penalizes players who over-build or leave infrastructure in place. It rewards elegant, minimal solutions that are easy to remove.

### Success Criteria
- Temporary customer powered during event
- Infrastructure completely removed after event
- Minimal permanent impact on grid

### Scoring Factors
- Service quality during event
- Removal completeness (no abandoned poles/wires)
- Cost efficiency (temporary infrastructure should be cheap)
- Time to install and remove

### Implementation Details
- Temporary customer appears with timer
- Event duration countdown (e.g., 300 seconds)
- After event, must remove temp infrastructure
- Scoring penalty for abandoned infrastructure
- Bonus for minimal permanent changes
- Visual marking of temporary structures

---

## Scenario 8: Audit and Compliance

**Category:** Hidden Risk / Technical Debt  
**Complexity:** ⭐⭐⭐ Complex

### Trigger
- **External inspection** announced
- **Code compliance check** scheduled
- Existing grid has violations

### Player Work
1. **Bring grid into spec** (fix violations)
2. **Fix invisible problems** (clearance, overloads, unsupported poles)
3. **Decide what to defer** (budget constraints force prioritization)

### What It Teaches
- **Latent risk** - Problems you can't see are still problems
- **Hidden technical debt** - Shortcuts accumulate
- **Why clean design pays off later** - Compliant grids easier to maintain

### Design Notes
Low drama, high tension. This appeals to the systems brain.

The scenario presents a pre-built grid with various violations - some critical (safety), some minor (aesthetic). Budget constraints force prioritization. Players learn risk assessment and triage.

This is excellent for teaching that "working" isn't the same as "correct" or "safe".

### Success Criteria
- All critical violations addressed
- Grid passes compliance check
- Budget maintained

### Scoring Factors
- Violation severity reduction
- Critical violations fixed (mandatory)
- Minor violations fixed (bonus)
- Budget efficiency
- Risk reduction per dollar spent

### Implementation Details
- Pre-built grid with embedded violations:
  - Clearance violations (conductor too close to terrain)
  - Overlong spans (exceed safe distance)
  - Tall unsupported poles (need guy-wires)
  - Overloaded paths (too many customers)
  - Mixed conductor types (non-compliant)
- Compliance checker UI showing all violations
- Severity ratings (critical/moderate/minor)
- Cost to fix each violation
- Budget forces prioritization
- Score based on risk reduction achieved

---

## Shared Patterns Across All Scenarios

### Common Elements
All scenarios share:
- **Same poles** - No new building blocks
- **Same spans** - No new connection mechanics
- **Same rules** - Physics and clearance stay constant

### Variable Pressures
Each scenario applies different pressures:
- **Time** - Scenarios 1, 6, 7 have countdown timers
- **Safety** - Scenarios 2, 4, 8 focus on risk management
- **Budget** - Scenarios 3, 5 emphasize cost tradeoffs
- **Reputation** - Scenario 8 introduces compliance scoring
- **Permanence** - Scenarios 5, 7 teach about reversibility

### Design Benefits
**This is textbook good design:**
- We are not adding mechanics
- We are rotating the spotlight
- Depth comes from context, not complexity
- Each scenario teaches by framing the same tools differently

---

## Scenario Difficulty Progression

### Tutorial Track
1. **Lightning Strike** - Learn repair basics
2. **Vegetation Clearance** - Learn prevention
3. **Temporary Service** - Learn build/unbuild

### Intermediate Track
4. **New Customer Growth** - Learn integration
5. **Conductor Replacement** - Learn upgrades
6. **Audit & Compliance** - Learn prioritization

### Advanced Track
7. **Emergency Backfeed** - Test redundancy planning
8. **Targeted Undergrounding** - Test long-term investment

---

## Educational Value

### Real-World Concepts Taught
- **Preventative maintenance** reduces long-term costs
- **Grid topology** affects resilience and capacity
- **Infrastructure properties** matter (conductor types)
- **Redundancy** enables operational flexibility
- **Technical debt** accumulates from shortcuts
- **Temporary solutions** have hidden costs
- **Compliance** isn't optional in real grids
- **Long-term thinking** beats short-term optimization

### Skills Developed
- Systems thinking
- Risk assessment
- Resource prioritization
- Tradeoff evaluation
- Network topology design
- Capacity planning
- Cost-benefit analysis
- Proactive vs reactive decision making

---

## Implementation Philosophy

### Keep It Simple
- Use existing ChallengeMode infrastructure
- Scenarios are configurations, not new systems
- Reuse power propagation, budget tracking, UI elements
- Add minimal new code for scenario-specific logic

### Make It Extensible
- JSON-based scenario definitions
- Plugin architecture for custom logic
- Easy to add new scenarios later
- Community scenario authoring potential

### Make It Engaging
- Clear objectives and feedback
- Visual indicators for scenario state
- Satisfying completion screens
- Progression and variety

---

## Future Scenario Ideas

### Additional Concepts to Explore
- **Storm damage response** - Multiple simultaneous failures
- **Planned maintenance window** - Work during low-demand period
- **Budget crisis** - Extreme cost constraints
- **Customer priority** - Hospital vs residential service restoration
- **Crew management** - Resource allocation across multiple sites
- **Equipment failure** - Transformer/breaker problems
- **Ice loading** - Winter weather span failures
- **Wildlife interference** - Animal-caused outages
- **Equipment upgrade** - Substation capacity expansion
- **Inter-utility coordination** - Connect to neighboring grid

---

## Conclusion

These eight scenarios provide a comprehensive curriculum for grid management education using a single set of game mechanics. Each scenario teaches distinct lessons by changing the context and constraints, not by adding complexity.

The scenarios progress from simple repair (lightning strike) to complex planning (undergrounding), from reactive work (emergency backfeed) to proactive work (vegetation clearance), from temporary solutions (event service) to permanent infrastructure (conductor replacement).

Together, they create a complete learning experience that respects player intelligence and rewards systems thinking.
