# Striver A2Z — Notes for Step 1 & Step 2

> Comprehensive study notes for the foundational programming problems in Striver's A2Z DSA sheet.
> Each entry: problem statement, example, approach, Java code, complexity.
> Source inspiration: takeuforward.org articles.

---

# Step 1 · Learn the Basics

## Section 1.2 — Patterns

### Pattern-printing general approach

Every pattern problem is solved with **two nested loops** — the outer loop controls the row, the inner loop(s) control what's printed in that row.

General recipe:

1. Identify the number of **rows**.
2. For each row, figure out what the inner loop prints:
   - How many leading spaces?
   - How many stars / numbers / characters?
   - How many trailing spaces (if any)?
3. Print a newline after every row.

Key insight: **write down row-by-row what the row looks like** and find the formula relating the row index to what's inside that row.

```java
for (int i = 1; i <= n; i++) {
    for (int s = 0; s < leadingSpaces(i); s++) System.out.print(" ");
    for (int c = 0; c < content(i);       c++) System.out.print("*");
    System.out.println();
}
```

Time complexity: **O(N²)** — inherent to printing an N×N grid or triangle.
Space complexity: **O(1)** (aside from the printed output).

---

### Pattern 1 — N×N Square

**Problem.** Given N, print an N×N grid of `*`.

**Example.** N = 3 →
```
***
***
***
```

**Approach.** Outer loop 1..N for rows. Inner loop 1..N prints N stars per row. Newline after each row.

```java
for (int i = 0; i < n; i++) {
    for (int j = 0; j < n; j++) System.out.print("*");
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

### Pattern 2 — Right Triangle

**Problem.** Row i (1-indexed) prints i stars.

**Example.** N = 4 →
```
*
**
***
****
```

**Approach.** Inner loop runs `i` times. Each row index tells you how many stars to print.

```java
for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= i; j++) System.out.print("*");
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

### Pattern 3 — Number Triangle

**Problem.** Row i prints numbers `1 2 … i` concatenated.

**Example.** N = 4 →
```
1
12
123
1234
```

**Approach.** Replace the `*` in Pattern 2 with the loop counter `j`.

```java
for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= i; j++) System.out.print(j);
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

### Pattern 4 — Inverted Right Triangle

**Problem.** Row i prints (N − i + 1) stars.

**Example.** N = 4 →
```
****
***
**
*
```

**Approach.** Let inner loop count `j` from i to N (runs N−i+1 times). Each row starts wide and narrows.

```java
for (int i = 1; i <= n; i++) {
    for (int j = i; j <= n; j++) System.out.print("*");
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

### Pattern 5 — Star Pyramid (centered)

**Problem.** Row i has (N − i) leading spaces and (2i − 1) stars.

**Example.** N = 4 →
```
   *
  ***
 *****
*******
```

**Approach.** Three sub-loops per row: spaces, stars, (optionally trailing spaces).

```java
for (int i = 1; i <= n; i++) {
    for (int s = 1; s <= n - i; s++) System.out.print(" ");
    for (int st = 1; st <= 2*i - 1; st++) System.out.print("*");
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

### Pattern 6 — Rhombus (parallelogram)

**Problem.** Row i has (N − i) leading spaces and N stars.

**Example.** N = 4 →
```
   ****
  ****
 ****
****
```

**Approach.** Leading spaces reduce each row; every row has exactly N stars.

```java
for (int i = 1; i <= n; i++) {
    for (int s = 1; s <= n - i; s++) System.out.print(" ");
    for (int st = 1; st <= n; st++) System.out.print("*");
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

### Pattern 7 — Hollow Rectangle

**Problem.** Print an N×M rectangle of `*` — border only, interior is spaces.

**Example.** N = 3, M = 5 →
```
*****
*   *
*****
```

**Approach.** A cell is a `*` iff it's on the first/last row OR the first/last column.

```java
for (int i = 0; i < n; i++) {
    for (int j = 0; j < m; j++) {
        if (i == 0 || i == n-1 || j == 0 || j == m-1) System.out.print("*");
        else System.out.print(" ");
    }
    System.out.println();
}
```

**Complexity:** Time O(N·M), Space O(1).

---

### Pattern 8 — Half Diamond

**Problem.** Rows 1..N have increasing stars (i stars), then rows N+1..2N-1 have decreasing stars.

**Example.** N = 3 →
```
*
**
***
**
*
```

**Approach.** Two passes: upward triangle (1..N), then downward triangle (N-1..1).

```java
for (int i = 1; i <= n; i++) {
    for (int j = 0; j < i; j++) System.out.print("*");
    System.out.println();
}
for (int i = n - 1; i >= 1; i--) {
    for (int j = 0; j < i; j++) System.out.print("*");
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

### Pattern 9 — Full Diamond

**Problem.** A pyramid on top (N rows) and an inverted pyramid below (N rows).

**Example.** N = 3 →
```
  *
 ***
*****
*****
 ***
  *
```

**Approach.**
- Top half row i: (N − i) spaces + (2i − 1) stars
- Bottom half row i: (i − 1) spaces + (2(N − i) + 1) stars

```java
for (int i = 1; i <= n; i++) {
    for (int s = 1; s <= n - i; s++) System.out.print(" ");
    for (int st = 1; st <= 2*i - 1; st++) System.out.print("*");
    System.out.println();
}
for (int i = 1; i <= n; i++) {
    for (int s = 1; s <= i - 1; s++) System.out.print(" ");
    for (int st = 1; st <= 2*(n - i) + 1; st++) System.out.print("*");
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

### Pattern 10 — Butterfly

**Problem.** Two vertical halves with stars growing outward then shrinking.

**Example.** N = 3 →
```
*    *
**  **
******
******
**  **
*    *
```

**Approach.** Row i (top): i stars + 2(N − i) spaces + i stars. Bottom half mirrors.

```java
for (int i = 1; i <= n; i++) {
    for (int j = 0; j < i; j++) System.out.print("*");
    for (int s = 0; s < 2*(n - i); s++) System.out.print(" ");
    for (int j = 0; j < i; j++) System.out.print("*");
    System.out.println();
}
for (int i = n; i >= 1; i--) {
    for (int j = 0; j < i; j++) System.out.print("*");
    for (int s = 0; s < 2*(n - i); s++) System.out.print(" ");
    for (int j = 0; j < i; j++) System.out.print("*");
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

### Pattern 11 — Number pyramid with alternating 0/1

**Problem.** Row i (i is 1-indexed, printing i digits) starts with 1 if i is odd else 0; digits alternate.

**Example.** N = 4 →
```
1
01
101
0101
```

**Approach.** Track a start digit based on row parity; flip with `d ^= 1` after each print.

```java
for (int i = 1; i <= n; i++) {
    int d = (i % 2 == 1) ? 1 : 0;
    for (int j = 1; j <= i; j++) {
        System.out.print(d);
        d ^= 1;
    }
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

### Pattern 12 — Mirrored Number Triangle

**Problem.** Row i prints 1..i then spaces then i..1.

**Example.** N = 3 →
```
1    1
12  21
123321
```

**Approach.** Three segments: ascending 1..i, middle gap `2(N − i)`, descending i..1.

```java
for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= i; j++) System.out.print(j);
    for (int s = 1; s <= 2*(n - i); s++) System.out.print(" ");
    for (int j = i; j >= 1; j--) System.out.print(j);
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

### Pattern 13 — Number Crown (running counter)

**Problem.** Row i prints i consecutive natural numbers that continue from the previous row.

**Example.** N = 4 →
```
1
23
456
78910
```

**Approach.** Maintain a single counter `k` incremented after each print; it doesn't reset per row.

```java
int k = 1;
for (int i = 1; i <= n; i++) {
    for (int j = 1; j <= i; j++) System.out.print(k++);
    System.out.println();
}
```

**Complexity:** Time O(N²), Space O(1).

---

## Section 1.4 — Basic Math

The common tool here is **digit extraction via mod 10**: repeatedly take `n % 10` to get the last digit, then do `n /= 10` to remove it. This runs in O(log₁₀ N) — one iteration per digit.

```java
while (n > 0) {
    int d = n % 10;   // last digit
    n /= 10;          // drop it
}
```

---

### Count Digits

**Problem.** Given N ≥ 1, count its digits.

**Example.** N = 7789 → 4.

**Approach 1 — Divide by 10.** Keep dividing until N becomes 0; count iterations.

```java
int count = 0;
while (n > 0) { count++; n /= 10; }
System.out.println(count);
```

**Time:** O(log₁₀ N). **Space:** O(1).

**Approach 2 — Logarithm (O(1)).** `count = (int) Math.log10(N) + 1`.

```java
System.out.println((int) Math.log10(n) + 1);
```

Edge case: N = 0 has 1 digit — handle separately.

---

### Reverse a Number

**Problem.** Reverse the digits of N. `120 → 21` (leading zeros drop).

**Example.** N = 1234 → 4321.

**Approach.** Pull last digit, append to accumulator `rev`: `rev = rev * 10 + n % 10`.

```java
int rev = 0;
while (n > 0) {
    rev = rev * 10 + n % 10;
    n /= 10;
}
System.out.println(rev);
```

**Dry run:** n = 123.
- rev = 0·10 + 3 = 3, n = 12
- rev = 3·10 + 2 = 32, n = 1
- rev = 32·10 + 1 = 321, n = 0
- Output: 321 ✓

**Time:** O(log N). **Space:** O(1).

**Note.** For very large inputs, `rev` can overflow an `int`; use `long` or handle overflow checks.

---

### Check Palindrome Number

**Problem.** Print `true` if N equals its reverse, else `false`. (e.g. 121 → true, 123 → false)

**Approach.** Reverse N (saving the original first!) and compare.

```java
int orig = n, rev = 0;
while (n > 0) { rev = rev * 10 + n % 10; n /= 10; }
System.out.println(rev == orig ? "true" : "false");
```

**Why save `orig`?** The reversal loop destroys `n` — you need the original for comparison.

**Time:** O(log N). **Space:** O(1).

---

### GCD / HCF of Two Numbers

**Problem.** Greatest common divisor of A and B.

**Approach 1 — Brute force.** Check every divisor from min(A,B) down to 1. **Time O(min(A,B))**.

**Approach 2 — Euclidean algorithm (OPTIMAL).** `gcd(a, b) = gcd(b, a % b)`; when b becomes 0, a is the answer.

```java
while (b != 0) {
    int t = b;
    b = a % b;
    a = t;
}
System.out.println(a);
```

**Why it works.** Any divisor of both `a` and `b` also divides `a − q·b = a % b`. So gcd is preserved across the substitution. The mod shrinks values fast.

**Time:** O(log(min(A,B))). **Space:** O(1).

**LCM trick.** `lcm(a,b) = a*b / gcd(a,b)`.

---

### Armstrong Number

**Problem.** A 3-digit N is Armstrong iff N = sum of cubes of its digits. `153 = 1³ + 5³ + 3³ = 153 ✓`. Return true/false.

**Approach.** Extract digits, cube and sum, compare to original.

```java
int orig = n, sum = 0;
while (n > 0) {
    int d = n % 10;
    sum += d * d * d;
    n /= 10;
}
System.out.println(sum == orig ? "true" : "false");
```

**Time:** O(log N). **Space:** O(1).

**General Armstrong.** For k-digit numbers, use d^k instead of d^3.

---

### Print All Divisors

**Problem.** Print divisors of N in ascending order.

**Approach 1 — Brute (O(N)).** Loop i from 1 to N, collect those dividing N.

**Approach 2 — Sqrt(N) (OPTIMAL).** For every divisor `i ≤ √N`, `N/i` is also a divisor. Collect both, dedup when i == N/i, sort once at the end.

```java
List<Integer> d = new ArrayList<>();
for (int i = 1; (long) i * i <= n; i++) {
    if (n % i == 0) {
        d.add(i);
        if (i != n / i) d.add(n / i);
    }
}
Collections.sort(d);
// print d
```

**Why it works.** Divisors come in pairs (i, n/i). Each pair has exactly one element ≤ √N — so looping up to √N catches all of them.

**Time:** O(√N · log √N) (the sort dominates). **Space:** O(D) where D is the number of divisors.

---

### Check for Prime

**Problem.** Is N prime?

**Approach.** Trial division up to √N. If any `i` in [2, √N] divides N, it's composite.

```java
if (n < 2) { System.out.println("false"); return; }
boolean prime = true;
for (int i = 2; (long) i * i <= n; i++) {
    if (n % i == 0) { prime = false; break; }
}
System.out.println(prime);
```

**Why √N?** If N = a · b with a ≤ b, then a ≤ √N. So the smaller factor always shows up in [2, √N].

**Time:** O(√N). **Space:** O(1).

**Further optimization.** Skip even candidates > 2: check 2 separately, then only odd i.

---

## Section 1.5 — Basic Recursion

A recursive function has **two parts**:
1. **Base case** — the smallest input for which we know the answer directly. Prevents infinite recursion.
2. **Recursive case** — calls itself on a smaller / simpler input and combines the result.

**Trust the recursion.** Assume `f(smaller)` works correctly when designing `f(n)`. Don't trace by hand beyond one or two levels.

**Stack depth.** Each call adds a frame. Deep recursion (millions) causes `StackOverflowError` — prefer iteration for those.

---

### Print Name N times using recursion

**Problem.** Print a given name N times using recursion (no loops).

**Approach.** Base: i > N → stop. Recursive: print name, call with i+1.

```java
static void print(int i, int n, String s) {
    if (i > n) return;
    System.out.println(s);
    print(i + 1, n, s);
}
```

**Call:** `print(1, n, name);`
**Time:** O(N). **Space:** O(N) stack.

---

### Print 1 to N using Recursion

**Problem.** Use recursion to print 1, 2, …, N.

**Approach.** Print i, recurse on i+1. Base: i > N.

```java
static void print(int i, int n) {
    if (i > n) return;
    System.out.print(i + " ");
    print(i + 1, n);
}
```

**Time:** O(N). **Space:** O(N) stack.

**Alternative (bottom-up print):** recurse first, print after — gives 1..N naturally when called with `print(n)` printing post-recursion: base i<1 return; `print(i-1); System.out.print(i+" ");`.

---

### Print N to 1 using Recursion

**Problem.** Print N, N−1, …, 1.

**Approach.** Print first, then recurse on i − 1. Base: i < 1.

```java
static void print(int i) {
    if (i < 1) return;
    System.out.print(i + " ");
    print(i - 1);
}
```

**Time:** O(N). **Space:** O(N) stack.

---

### Sum of first N numbers

**Problem.** Compute 1 + 2 + … + N using recursion.

**Approach — Functional style.** `sum(n) = n + sum(n − 1)`; base `sum(0) = 0`.

```java
static long sum(int n) {
    if (n == 0) return 0;
    return n + sum(n - 1);
}
```

**Approach — Parameterized accumulator.** `sum(i, acc)`: if i==0 return acc; else sum(i-1, acc+i). Tail-recursive; some languages optimize.

**Closed form.** Not recursion, but `n*(n+1)/2` is O(1).

**Time:** O(N). **Space:** O(N) stack.

---

### Factorial of N

**Problem.** Compute N!.

**Approach.** `fact(0) = fact(1) = 1`; `fact(n) = n * fact(n − 1)`.

```java
static long fact(int n) {
    if (n <= 1) return 1;
    return n * fact(n - 1);
}
```

**Overflow note.** 13! already overflows `int`. Use `long` (good to 20!) or `BigInteger` for bigger N.

**Time:** O(N). **Space:** O(N) stack.

---

### Reverse an Array (recursive, in place)

**Problem.** Reverse an int array in place using recursion.

**Approach — Two pointers.** Swap `a[l]` and `a[r]`, recurse with `l+1, r-1`. Base: `l >= r`.

```java
static void reverse(int[] a, int l, int r) {
    if (l >= r) return;
    int t = a[l]; a[l] = a[r]; a[r] = t;
    reverse(a, l + 1, r - 1);
}
```

**Alternative — Single pointer.** `reverse(a, i)`: swap `a[i]` and `a[n-1-i]`; stop at `i >= n/2`.

**Time:** O(N). **Space:** O(N/2) stack.

---

### Check Palindrome String (recursive)

**Problem.** Is a string a palindrome? Return true/false.

**Approach — Two pointers.** If `s[l] != s[r]` → false. If `l >= r` → true. Else recurse with `l+1, r-1`.

```java
static boolean isPal(String s, int l, int r) {
    if (l >= r) return true;
    if (s.charAt(l) != s.charAt(r)) return false;
    return isPal(s, l + 1, r - 1);
}
```

**Time:** O(N/2) = O(N). **Space:** O(N/2) stack.

---

### Fibonacci Number

**Problem.** F(0) = 0, F(1) = 1, F(n) = F(n−1) + F(n−2). Find F(N).

**Approach — Naive recursion.** Direct from the definition.

```java
static long fib(int n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}
```

**Time:** O(2^N) — the call tree branches twice and has exponential size.
**Space:** O(N) stack.

**Approach — Memoization (O(N)).** Cache repeated sub-problems.

```java
static long[] memo;
static long fib(int n) {
    if (n < 2) return n;
    if (memo[n] != -1) return memo[n];
    return memo[n] = fib(n - 1) + fib(n - 2);
}
// init memo = new long[n+1]; Arrays.fill(memo, -1);
```

**Approach — Iterative DP (O(N) time, O(1) space).** Track just the last two values.

```java
long prev2 = 0, prev1 = 1;
for (int i = 2; i <= n; i++) {
    long cur = prev1 + prev2;
    prev2 = prev1;
    prev1 = cur;
}
System.out.println(n == 0 ? 0 : prev1);
```

This is the canonical **"exponential → polynomial"** lesson of DP.

---

## Section 1.6 — Basic Hashing

Hashing stores counts or boolean "seen" flags in a **map** (or an **array** indexed by value, when values are bounded and small).

- **Array-based hashing**: O(1) access, but requires bounded domain. `int[] freq = new int[N+1]`.
- **HashMap**: handles arbitrary keys. O(1) average, O(N) worst on pathological inputs.
- **LinkedHashMap**: preserves insertion order — useful when order matters.

---

### Counting Frequencies of Array Elements

**Problem.** Print each distinct value with its count, in first-occurrence order.

**Approach.** Iterate the array; use a `LinkedHashMap<Integer, Integer>` so output order matches insertion. Increment with `merge`.

```java
Map<Integer, Integer> f = new LinkedHashMap<>();
for (int v : a) f.merge(v, 1, Integer::sum);
for (var e : f.entrySet())
    System.out.println(e.getKey() + " " + e.getValue());
```

**Time:** O(N) average. **Space:** O(K) where K is the number of distinct values.

**Array variant.** If values are small (0..10⁶), `int[] freq = new int[MAX+1]` is faster and simpler.

---

### Highest / Lowest Frequency Element

**Problem.** Find the element with maximum frequency and the element with minimum frequency.

**Approach.** Build a frequency map; scan it once, tracking max/min counts (with tie-break if needed).

```java
Map<Integer, Integer> f = new HashMap<>();
for (int v : a) f.merge(v, 1, Integer::sum);

int maxC = -1, minC = Integer.MAX_VALUE, maxK = 0, minK = 0;
for (var e : f.entrySet()) {
    int k = e.getKey(), c = e.getValue();
    if (c > maxC || (c == maxC && k < maxK)) { maxC = c; maxK = k; }
    if (c < minC || (c == minC && k < minK)) { minC = c; minK = k; }
}
System.out.println(maxK);
System.out.println(minK);
```

**Time:** O(N). **Space:** O(K).

---

# Step 2 · Learn Important Sorting Techniques

## Comparison of sorting algorithms

| Algorithm | Best | Average | Worst | Space | Stable | Notes |
|---|---|---|---|---|---|---|
| Selection | O(N²) | O(N²) | O(N²) | O(1) | ❌ | Always does N² comparisons |
| Bubble | **O(N)** | O(N²) | O(N²) | O(1) | ✅ | Best case with early-exit |
| Insertion | **O(N)** | O(N²) | O(N²) | O(1) | ✅ | Great for nearly-sorted / small |
| Merge | O(N log N) | O(N log N) | O(N log N) | O(N) | ✅ | Guaranteed N log N |
| Quick | O(N log N) | O(N log N) | **O(N²)** | O(log N) | ❌ | Fastest in practice; random pivot |

**Stability** = equal elements keep their original relative order. Matters when sorting by one key but you care about order within ties.

**Lower bound.** Any comparison-based sort needs Ω(N log N) comparisons worst-case.

---

### Selection Sort

**Idea.** For each position i, find the **minimum** in the unsorted suffix and swap it into a[i]. The sorted prefix grows one element at a time.

**Dry run.** `[64, 25, 12, 22, 11]`
- i=0: min in suffix is 11 (idx 4). Swap → `[11, 25, 12, 22, 64]`
- i=1: min in `[25,12,22,64]` is 12 (idx 2). Swap → `[11, 12, 25, 22, 64]`
- i=2: min is 22 (idx 3). Swap → `[11, 12, 22, 25, 64]`
- i=3: min is 25, already in place. Done.

```java
static void selectionSort(int[] a) {
    int n = a.length;
    for (int i = 0; i < n - 1; i++) {
        int mi = i;
        for (int j = i + 1; j < n; j++) if (a[j] < a[mi]) mi = j;
        int t = a[i]; a[i] = a[mi]; a[mi] = t;
    }
}
```

**Time:** O(N²) always. **Space:** O(1). **Stable?** No (the long-distance swap can break ordering of equal keys).

---

### Bubble Sort

**Idea.** Repeatedly pass over the array; swap adjacent pairs that are out of order. After pass i, the largest i+1 elements are bubbled to the end.

**Key optimization.** If a full pass makes zero swaps, the array is already sorted — break early.

```java
static void bubbleSort(int[] a) {
    int n = a.length;
    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < n - i - 1; j++) {
            if (a[j] > a[j+1]) {
                int t = a[j]; a[j] = a[j+1]; a[j+1] = t;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}
```

**Time:** O(N²) worst, **O(N) best** (already sorted → one pass → break). **Space:** O(1). **Stable:** yes.

---

### Insertion Sort

**Idea.** Think of sorting cards in your hand. For each next card, slide it left past the larger cards until it lands in its correct spot.

**Dry run.** `[12, 11, 13, 5, 6]`
- i=1 (key=11): shift 12 right → `[11, 12, 13, 5, 6]`
- i=2 (key=13): already ≥ all; no shift.
- i=3 (key=5): shift 13,12,11 → `[5, 11, 12, 13, 6]`
- i=4 (key=6): shift 13,12,11 → `[5, 6, 11, 12, 13]`

```java
static void insertionSort(int[] a) {
    int n = a.length;
    for (int i = 1; i < n; i++) {
        int key = a[i], j = i - 1;
        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
        a[j + 1] = key;
    }
}
```

**Time:** O(N²) worst, **O(N) best** (sorted input → inner loop never runs). **Space:** O(1). **Stable:** yes.

**When it shines.** Small arrays (N < 20) and nearly-sorted arrays. Real sort libraries (Java TimSort) use insertion sort for small runs.

---

### Merge Sort

**Idea — Divide and conquer.**
1. **Divide** the array into two halves.
2. **Recursively sort** each half.
3. **Merge** two sorted halves into one sorted array using two pointers.

**Recurrence.** T(N) = 2 · T(N/2) + O(N) → **O(N log N)** (Master Theorem).

```java
static void mergeSort(int[] a, int l, int r) {
    if (l >= r) return;
    int m = (l + r) / 2;
    mergeSort(a, l, m);
    mergeSort(a, m + 1, r);
    merge(a, l, m, r);
}

static void merge(int[] a, int l, int m, int r) {
    int[] tmp = new int[r - l + 1];
    int i = l, j = m + 1, k = 0;
    while (i <= m && j <= r) tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++];
    while (i <= m) tmp[k++] = a[i++];
    while (j <= r) tmp[k++] = a[j++];
    for (int x = 0; x < tmp.length; x++) a[l + x] = tmp[x];
}
```

**Time:** O(N log N) — guaranteed, all cases. **Space:** O(N) extra (temp array).

**Stable:** yes (use `<=` in the merge so left side wins ties).

**Why use merge sort?** Guaranteed performance regardless of input; stable; great for linked lists (no random access needed).

---

### Recursive Bubble Sort

**Idea.** Replace only the **outer** loop with recursion. Each recursive call does one inner pass, then recurses on the unsorted prefix of length n − 1.

```java
static void bubble(int[] a, int n) {
    if (n == 1) return;
    for (int i = 0; i < n - 1; i++) {
        if (a[i] > a[i + 1]) { int t = a[i]; a[i] = a[i+1]; a[i+1] = t; }
    }
    bubble(a, n - 1);
}
```

**Time:** O(N²). **Space:** O(N) stack (n recursive frames).

**Why learn it?** Practice "replace a loop with recursion" — useful pattern in tree/graph problems later.

---

### Recursive Insertion Sort

**Idea.** Recurse to sort `a[0..i-1]`, then insert `a[i]` into its correct position in the sorted prefix.

```java
static void insert(int[] a, int i) {
    int key = a[i], j = i - 1;
    while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
    a[j + 1] = key;
}
static void sort(int[] a, int i, int n) {
    if (i >= n) return;
    insert(a, i);
    sort(a, i + 1, n);
}
```

**Time:** O(N²). **Space:** O(N) stack.

---

### Quick Sort

**Idea — Partition and recurse.**
1. Pick a **pivot** (e.g., last element).
2. **Partition**: rearrange so everything ≤ pivot is to its left and everything > pivot is to its right. Return the pivot's final index.
3. **Recurse** on the left and right sub-arrays.

```java
static int partition(int[] a, int lo, int hi) {
    int pivot = a[hi];
    int i = lo - 1;
    for (int j = lo; j < hi; j++) {
        if (a[j] <= pivot) {
            i++;
            int t = a[i]; a[i] = a[j]; a[j] = t;
        }
    }
    int t = a[i + 1]; a[i + 1] = a[hi]; a[hi] = t;
    return i + 1;
}
static void quick(int[] a, int lo, int hi) {
    if (lo < hi) {
        int p = partition(a, lo, hi);
        quick(a, lo, p - 1);
        quick(a, p + 1, hi);
    }
}
```

**Time:** O(N log N) average, **O(N²) worst** (already sorted + last-element pivot). **Space:** O(log N) average recursion depth (O(N) worst).

**Stable:** no.

**In practice.** Randomize the pivot (swap `a[random(lo,hi)]` with `a[hi]` before partitioning) — makes the expected running time O(N log N) regardless of input. Usually the fastest sort in practice because of its good cache behavior.

---

## Quick reference — which sort when?

- **Need guaranteed N log N and stability** → Merge sort.
- **In-memory, typical data, speed matters** → Quick sort (randomized pivot).
- **Small array / nearly sorted / need simple code** → Insertion sort.
- **Must sort linked list** → Merge sort.
- **Almost never use** → Bubble and Selection in real code — they're teaching tools.

**Java's `Arrays.sort`** uses Dual-Pivot Quicksort for primitives and Timsort (a merge-insertion hybrid) for objects.

---

# End of Step 1 & Step 2 notes

**What you've learned:**
- Pattern printing (two-loop paradigm, row/column reasoning)
- Digit manipulation via mod 10
- Euclidean GCD (mod-based shrinking)
- Sqrt(N) optimizations for divisor/prime checks
- The two ingredients of recursion: base case + recursive case
- The exponential → polynomial DP lesson via Fibonacci
- Hashing fundamentals (array vs hash map, insertion-order preservation)
- All five comparison-based sorting algorithms, their trade-offs, and when to use each

**Practice these via the DSA tool** (http://localhost:3101) until they feel automatic.
