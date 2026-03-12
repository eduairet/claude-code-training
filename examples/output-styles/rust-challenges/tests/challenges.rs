use rust_challenges::*;

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

// ─── Challenge 2: MinStack ─────────────────────────────────────────

#[test]
fn minstack_push_pop_min() {
    let mut s = MinStack::new();
    s.push(3);
    s.push(1);
    s.push(2);
    assert_eq!(s.min(), Some(&1));
    assert_eq!(s.pop(), Some(2));
    assert_eq!(s.min(), Some(&1));
    assert_eq!(s.pop(), Some(1));
    assert_eq!(s.min(), Some(&3));
}

#[test]
fn minstack_empty() {
    let s: MinStack<i32> = MinStack::new();
    assert!(s.is_empty());
    assert_eq!(s.min(), None);
}

#[test]
fn minstack_duplicate_mins() {
    let mut s = MinStack::new();
    s.push(2);
    s.push(2);
    s.push(1);
    assert_eq!(s.min(), Some(&1));
    s.pop();
    assert_eq!(s.min(), Some(&2));
    s.pop();
    assert_eq!(s.min(), Some(&2));
}

#[test]
fn minstack_descending_order() {
    let mut s = MinStack::new();
    s.push(5);
    s.push(4);
    s.push(3);
    s.push(2);
    s.push(1);
    for expected in 1..=5 {
        assert_eq!(s.min(), Some(&expected));
        s.pop();
    }
    assert!(s.is_empty());
}

// ─── Challenge 3: Roman Numerals ───────────────────────────────────

#[test]
fn roman_basic_values() {
    assert_eq!(to_roman(1), "I");
    assert_eq!(to_roman(4), "IV");
    assert_eq!(to_roman(9), "IX");
    assert_eq!(to_roman(40), "XL");
    assert_eq!(to_roman(90), "XC");
    assert_eq!(to_roman(400), "CD");
    assert_eq!(to_roman(900), "CM");
}

#[test]
fn roman_complex() {
    assert_eq!(to_roman(1994), "MCMXCIV");
    assert_eq!(to_roman(3999), "MMMCMXCIX");
    assert_eq!(to_roman(58), "LVIII");
}

#[test]
fn roman_round_numbers() {
    assert_eq!(to_roman(1000), "M");
    assert_eq!(to_roman(500), "D");
    assert_eq!(to_roman(100), "C");
    assert_eq!(to_roman(50), "L");
    assert_eq!(to_roman(10), "X");
    assert_eq!(to_roman(5), "V");
}

// ─── Challenge 4: Balanced Brackets ────────────────────────────────

#[test]
fn balanced_simple() {
    assert!(is_balanced("()"));
    assert!(is_balanced("[]"));
    assert!(is_balanced("{}"));
}

#[test]
fn balanced_nested() {
    assert!(is_balanced("{[()]}"));
    assert!(is_balanced("((()))"));
}

#[test]
fn balanced_with_other_chars() {
    assert!(is_balanced("fn main() { let v = vec![1, 2, 3]; }"));
}

#[test]
fn unbalanced_cases() {
    assert!(!is_balanced("(]"));
    assert!(!is_balanced("([)]"));
    assert!(!is_balanced("{"));
    assert!(!is_balanced(")"));
}

#[test]
fn balanced_empty() {
    assert!(is_balanced(""));
    assert!(is_balanced("hello world"));
}

// ─── Challenge 5: Flatten Nested Vec ───────────────────────────────

#[test]
fn flatten_single_value() {
    let n = Nested::Val(42);
    assert_eq!(n.flatten(), vec![42]);
}

#[test]
fn flatten_flat_list() {
    let n = Nested::List(vec![Nested::Val(1), Nested::Val(2), Nested::Val(3)]);
    assert_eq!(n.flatten(), vec![1, 2, 3]);
}

#[test]
fn flatten_deeply_nested() {
    // [[1, [2, 3]], [4, [5, [6]]]]
    let n = Nested::List(vec![
        Nested::List(vec![
            Nested::Val(1),
            Nested::List(vec![Nested::Val(2), Nested::Val(3)]),
        ]),
        Nested::List(vec![
            Nested::Val(4),
            Nested::List(vec![
                Nested::Val(5),
                Nested::List(vec![Nested::Val(6)]),
            ]),
        ]),
    ]);
    assert_eq!(n.flatten(), vec![1, 2, 3, 4, 5, 6]);
}

#[test]
fn flatten_empty_lists() {
    let n = Nested::List(vec![
        Nested::List(vec![]),
        Nested::Val(1),
        Nested::List(vec![Nested::List(vec![])]),
    ]);
    assert_eq!(n.flatten(), vec![1]);
}
