use rust_challenges::FizzBuzz;

// ─── Challenge 1: FizzBuzz Iterator ────────────────────────────────

#[test]
fn fizzbuzz_basic_range() {
    let result: Vec<String> = FizzBuzz::new(1, 16).collect();
    assert_eq!(
        result,
        vec![
            "1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz",
            "13", "14", "FizzBuzz"
        ]
    );
}

#[test]
fn fizzbuzz_single_fizzbuzz() {
    let result: Vec<String> = FizzBuzz::new(15, 16).collect();
    assert_eq!(result, vec!["FizzBuzz"]);
}

#[test]
fn fizzbuzz_empty_range() {
    let result: Vec<String> = FizzBuzz::new(5, 5).collect();
    assert!(result.is_empty());
}

#[test]
fn fizzbuzz_only_fizz() {
    let result: Vec<String> = FizzBuzz::new(9, 10).collect();
    assert_eq!(result, vec!["Fizz"]);
}

