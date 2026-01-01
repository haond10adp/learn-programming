/**
 * Promises - Examples
 * 
 * Demonstrates Promise patterns, chaining, error handling, and composition.
 * Run: npx tsx 05-async-programming/03-promises/examples.ts
 */

// ============================================================================
// EXAMPLE 1: Promise Basics
// ============================================================================

console.log('✅ Example 1: Promise Basics\n');

// Creating a Promise
const promise = new Promise<number>((resolve, reject) => {
  setTimeout(() => {
    resolve(42);
  }, 100);
});

promise.then((value) => {
  console.log('Promise resolved with:', value);
});

// Promise states: pending -> fulfilled or rejected
const pending = new Promise<void>((resolve) => {
  // Never resolves, stays pending forever
});

const fulfilled = Promise.resolve('success');
const rejected = Promise.reject(new Error('failure'));

// ============================================================================
// EXAMPLE 2: Promise Chaining
// ============================================================================

console.log('\n✅ Example 2: Promise Chaining\n');

Promise.resolve(1)
  .then((x) => {
    console.log('Step 1:', x); // 1
    return x * 2;
  })
  .then((x) => {
    console.log('Step 2:', x); // 2
    return x + 3;
  })
  .then((x) => {
    console.log('Step 3:', x); // 5
    return x.toString();
  })
  .then((x) => {
    console.log('Final:', x, typeof x); // "5" string
  });

// ============================================================================
// EXAMPLE 3: Error Handling with catch
// ============================================================================

console.log('\n✅ Example 3: Error Handling\n');

Promise.resolve(1)
  .then((x) => {
    console.log('Before error:', x);
    throw new Error('Something went wrong!');
  })
  .then((x) => {
    console.log('This will not run:', x);
    return x * 2;
  })
  .catch((error) => {
    console.log('Caught error:', error.message);
    return 99; // Can recover by returning a value
  })
  .then((x) => {
    console.log('After recovery:', x); // 99
  });

// ============================================================================
// EXAMPLE 4: finally Block
// ============================================================================

console.log('\n✅ Example 4: finally Block\n');

function fetchWithCleanup(shouldFail: boolean) {
  console.log('Starting fetch...');
  
  return Promise.resolve()
    .then(() => {
      if (shouldFail) {
        throw new Error('Fetch failed');
      }
      return { data: 'Success!' };
    })
    .finally(() => {
      console.log('Cleanup: finally always runs');
    });
}

fetchWithCleanup(false)
  .then((result) => console.log('Success:', result))
  .catch((error) => console.log('Error:', error.message));

setTimeout(() => {
  fetchWithCleanup(true)
    .then((result) => console.log('Success:', result))
    .catch((error) => console.log('Error:', error.message));
}, 200);

// ============================================================================
// EXAMPLE 5: Promise.all - Parallel Execution
// ============================================================================

console.log('\n✅ Example 5: Promise.all\n');

const promise1 = new Promise<string>((resolve) => {
  setTimeout(() => resolve('First'), 300);
});

const promise2 = new Promise<string>((resolve) => {
  setTimeout(() => resolve('Second'), 100);
});

const promise3 = new Promise<string>((resolve) => {
  setTimeout(() => resolve('Third'), 200);
});

Promise.all([promise1, promise2, promise3]).then((results) => {
  console.log('All promises resolved:');
  console.log('Results:', results); // ['First', 'Second', 'Third']
  // Order matches input order, not completion order
});

// If any promise rejects, Promise.all rejects immediately
const failingPromise = new Promise<string>((_, reject) => {
  setTimeout(() => reject(new Error('Failed!')), 150);
});

setTimeout(() => {
  Promise.all([promise1, failingPromise, promise3])
    .then((results) => {
      console.log('This will not run');
    })
    .catch((error) => {
      console.log('\nPromise.all rejected:', error.message);
    });
}, 400);

// ============================================================================
// EXAMPLE 6: Promise.race - First to Complete
// ============================================================================

console.log('\n✅ Example 6: Promise.race\n');

const slow = new Promise<string>((resolve) => {
  setTimeout(() => resolve('Slow result'), 1000);
});

const fast = new Promise<string>((resolve) => {
  setTimeout(() => resolve('Fast result'), 200);
});

setTimeout(() => {
  Promise.race([slow, fast]).then((result) => {
    console.log('Race winner:', result); // 'Fast result'
  });
}, 500);

// Useful for timeouts
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout')), ms);
  });
  
  return Promise.race([promise, timeout]);
}

// ============================================================================
// EXAMPLE 7: Promise.allSettled - All Results
// ============================================================================

console.log('\n✅ Example 7: Promise.allSettled\n');

const success1 = Promise.resolve('Success 1');
const failure = Promise.reject(new Error('Failure'));
const success2 = Promise.resolve('Success 2');

setTimeout(() => {
  Promise.allSettled([success1, failure, success2]).then((results) => {
    console.log('\nAllSettled results:');
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`  ${index}: Fulfilled with`, result.value);
      } else {
        console.log(`  ${index}: Rejected with`, result.reason.message);
      }
    });
  });
}, 700);

// ============================================================================
// EXAMPLE 8: Promise.any - First Success
// ============================================================================

console.log('\n✅ Example 8: Promise.any\n');

const fail1 = Promise.reject(new Error('Error 1'));
const fail2 = Promise.reject(new Error('Error 2'));
const successLater = new Promise<string>((resolve) => {
  setTimeout(() => resolve('Finally succeeded!'), 300);
});

setTimeout(() => {
  Promise.any([fail1, fail2, successLater])
    .then((result) => {
      console.log('\nFirst success:', result);
    })
    .catch((error) => {
      console.log('All promises rejected:', error);
    });
}, 900);

// ============================================================================
// EXAMPLE 9: Chaining Promises with Async Operations
// ============================================================================

console.log('\n✅ Example 9: Realistic Promise Chain\n');

// Simulating API calls
function fetchUser(id: number): Promise<{ id: number; name: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Fetching user ${id}...`);
      resolve({ id, name: `User ${id}` });
    }, 200);
  });
}

function fetchPosts(userId: number): Promise<Array<{ id: number; title: string }>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Fetching posts for user ${userId}...`);
      resolve([
        { id: 1, title: 'Post 1' },
        { id: 2, title: 'Post 2' },
      ]);
    }, 200);
  });
}

function fetchComments(postId: number): Promise<Array<{ id: number; text: string }>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Fetching comments for post ${postId}...`);
      resolve([
        { id: 1, text: 'Comment 1' },
        { id: 2, text: 'Comment 2' },
      ]);
    }, 200);
  });
}

setTimeout(() => {
  fetchUser(1)
    .then((user) => {
      console.log('Got user:', user.name);
      return fetchPosts(user.id);
    })
    .then((posts) => {
      console.log('Got posts:', posts.length);
      return fetchComments(posts[0].id);
    })
    .then((comments) => {
      console.log('Got comments:', comments.length);
      console.log('Chain complete!');
    })
    .catch((error) => {
      console.error('Error in chain:', error);
    });
}, 1200);

// ============================================================================
// EXAMPLE 10: Creating Custom Promise Utilities
// ============================================================================

console.log('\n✅ Example 10: Custom Promise Utilities\n');

// Delay utility
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Retry utility
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delayMs: number
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }
      console.log(`Attempt ${attempt} failed, retrying...`);
      await delay(delayMs);
    }
  }
  throw new Error('Unreachable');
}

// Timeout utility
function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), ms)
    ),
  ]);
}

// Sequential execution
async function sequential<T>(
  promises: Array<() => Promise<T>>
): Promise<T[]> {
  const results: T[] = [];
  for (const promiseFn of promises) {
    results.push(await promiseFn());
  }
  return results;
}

// Test retry
setTimeout(() => {
  let attempts = 0;
  const unreliableOperation = () => {
    return new Promise<string>((resolve, reject) => {
      attempts++;
      setTimeout(() => {
        if (attempts < 3) {
          reject(new Error(`Attempt ${attempts} failed`));
        } else {
          resolve('Success after retries!');
        }
      }, 100);
    });
  };

  retry(unreliableOperation, 5, 100)
    .then((result) => {
      console.log('\nRetry succeeded:', result);
    })
    .catch((error) => {
      console.log('Retry failed:', error.message);
    });
}, 2000);

// ============================================================================
// EXAMPLE 11: Error Propagation
// ============================================================================

console.log('\n✅ Example 11: Error Propagation\n');

// Errors propagate through the chain until caught
setTimeout(() => {
  Promise.resolve(1)
    .then((x) => x * 2)
    .then((x) => {
      throw new Error('Error in step 2');
    })
    .then((x) => x + 3) // Skipped
    .then((x) => x * 4) // Skipped
    .catch((error) => {
      console.log('Caught error:', error.message);
      return 0; // Recover
    })
    .then((x) => {
      console.log('Continued after recovery:', x);
    });
}, 3000);

// ============================================================================
// EXAMPLE 12: Promise.resolve and Promise.reject
// ============================================================================

console.log('\n✅ Example 12: Promise.resolve and reject\n');

// Promise.resolve wraps any value in a Promise
const resolved1 = Promise.resolve(42);
const resolved2 = Promise.resolve(Promise.resolve(100)); // Unwraps nested promises

setTimeout(() => {
  resolved2.then((value) => {
    console.log('Unwrapped value:', value); // 100, not Promise<100>
  });
}, 3200);

// Promise.reject creates a rejected promise
const rejected1 = Promise.reject(new Error('Immediate rejection'));

rejected1.catch((error) => {
  console.log('Rejected:', error.message);
});

// ============================================================================
// Summary
// ============================================================================

setTimeout(() => {
  console.log('\n🎉 All Promise examples completed!');
  console.log('\nKey Concepts:');
  console.log('1. Promises represent eventual values');
  console.log('2. .then() chains transformations');
  console.log('3. .catch() handles errors');
  console.log('4. .finally() always runs (cleanup)');
  console.log('5. Promise.all - parallel, all must succeed');
  console.log('6. Promise.race - first to complete wins');
  console.log('7. Promise.allSettled - all results regardless');
  console.log('8. Promise.any - first success wins');
  console.log('9. Promises compose elegantly');
  console.log('10. Errors propagate until caught');
}, 3500);
