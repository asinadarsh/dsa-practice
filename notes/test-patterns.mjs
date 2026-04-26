// Sanity-test reference solutions for new pattern problems via the running server.
const tests = [
  ['pat-4-repnum', `import java.util.Scanner;
public class Main {
  public static void main(String[] a) {
    Scanner s = new Scanner(System.in);
    int n = s.nextInt();
    for (int i = 1; i <= n; i++) {
      for (int j = 1; j <= i; j++) System.out.print(i);
      System.out.println();
    }
  }
}`],
  ['pat-6-invnum', `import java.util.Scanner;
public class Main {
  public static void main(String[] a) {
    Scanner s = new Scanner(System.in);
    int n = s.nextInt();
    for (int i = 1; i <= n; i++) {
      for (int j = 1; j <= n - i + 1; j++) System.out.print(j);
      System.out.println();
    }
  }
}`],
  ['pat-8-invpyramid', `import java.util.Scanner;
public class Main {
  public static void main(String[] a) {
    Scanner s = new Scanner(System.in);
    int n = s.nextInt();
    for (int i = 1; i <= n; i++) {
      for (int sp = 1; sp <= i - 1; sp++) System.out.print(" ");
      for (int st = 1; st <= 2*(n - i) + 1; st++) System.out.print("*");
      System.out.println();
    }
  }
}`],
  ['pat-14-letter-tri', `import java.util.Scanner;
public class Main {
  public static void main(String[] a) {
    Scanner s = new Scanner(System.in);
    int n = s.nextInt();
    for (int i = 1; i <= n; i++) {
      for (int j = 0; j < i; j++) System.out.print((char)('A' + j));
      System.out.println();
    }
  }
}`],
  ['pat-15-inv-letter-tri', `import java.util.Scanner;
public class Main {
  public static void main(String[] a) {
    Scanner s = new Scanner(System.in);
    int n = s.nextInt();
    for (int i = 1; i <= n; i++) {
      for (int j = 0; j <= n - i; j++) System.out.print((char)('A' + j));
      System.out.println();
    }
  }
}`],
  ['pat-16-rep-letter', `import java.util.Scanner;
public class Main {
  public static void main(String[] a) {
    Scanner s = new Scanner(System.in);
    int n = s.nextInt();
    for (int i = 1; i <= n; i++) {
      char ch = (char) ('A' + i - 1);
      for (int j = 1; j <= i; j++) System.out.print(ch);
      System.out.println();
    }
  }
}`],
  ['pat-17-sym-letter', `import java.util.Scanner;
public class Main {
  public static void main(String[] a) {
    Scanner s = new Scanner(System.in);
    int n = s.nextInt();
    for (int i = 1; i <= n; i++) {
      for (int sp = 1; sp <= n - i; sp++) System.out.print(" ");
      char ch = 'A';
      int total = 2 * i - 1;
      int mid = (total + 1) / 2;
      for (int j = 1; j <= total; j++) {
        System.out.print(ch);
        if (j < mid) ch++;
        else ch--;
      }
      System.out.println();
    }
  }
}`],
  ['pat-18-rev-letter', `import java.util.Scanner;
public class Main {
  public static void main(String[] a) {
    Scanner s = new Scanner(System.in);
    int n = s.nextInt();
    for (int i = 1; i <= n; i++) {
      for (int j = n - i; j <= n - 1; j++) {
        System.out.print((char) ('A' + j));
      }
      System.out.println();
    }
  }
}`],
  ['pat-19-sym-stars', `import java.util.Scanner;
public class Main {
  public static void main(String[] a) {
    Scanner s = new Scanner(System.in);
    int n = s.nextInt();
    for (int i = 1; i <= n; i++) {
      for (int j = 0; j < n - i + 1; j++) System.out.print("*");
      for (int j = 0; j < 2 * (i - 1); j++) System.out.print(" ");
      for (int j = 0; j < n - i + 1; j++) System.out.print("*");
      System.out.println();
    }
    for (int i = n; i >= 1; i--) {
      for (int j = 0; j < n - i + 1; j++) System.out.print("*");
      for (int j = 0; j < 2 * (i - 1); j++) System.out.print(" ");
      for (int j = 0; j < n - i + 1; j++) System.out.print("*");
      System.out.println();
    }
  }
}`],
  ['pat-22-concentric', `import java.util.Scanner;
public class Main {
  public static void main(String[] a) {
    Scanner s = new Scanner(System.in);
    int n = s.nextInt();
    int width = 2 * n - 1;
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < width; i++) {
      for (int j = 0; j < width; j++) {
        int dist = Math.min(Math.min(i, j), Math.min(width - 1 - i, width - 1 - j));
        if (j > 0) sb.append(' ');
        sb.append(n - dist);
      }
      sb.append('\\n');
    }
    System.out.print(sb);
  }
}`],
];

let pass = 0, fail = 0;
for (const [id, code] of tests) {
  const r = await fetch(`http://localhost:3101/api/check/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const j = await r.json();
  const status = j.passed ? 'PASS' : 'FAIL';
  if (j.passed) pass++; else fail++;
  console.log(`${status}  ${id}  ${j.passCount}/${j.total}` + (j.firstFail ? ` — first fail stdin="${j.firstFail.stdin}"` : ''));
  if (!j.passed && j.firstFail) {
    console.log(`       expected:\n${j.firstFail.expected}`);
    console.log(`       got:\n${j.firstFail.actual}`);
  }
  if (j.compileError) console.log(`       compile: ${j.compileError.slice(0, 200)}`);
}
console.log(`\n${pass}/${tests.length} passed.`);
