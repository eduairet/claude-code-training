/// Challenge 1: Fizzbuzz Iterator
///
/// Implement an iterator that yields FizzBuzz values for a given range.
/// - Multiples of 3 → "Fizz"
/// - Multiples of 5 → "Buzz"
/// - Multiples of both → "FizzBuzz"
/// - Otherwise → the number as a string
pub struct FizzBuzz {
    // TODO(human): add fields
    current: u32,
    end: u32,
}

impl FizzBuzz {
    pub fn new(start: u32, end: u32) -> Self {
        // TODO(human): implement constructor
        Self {
            current: start,
            end,
        }
    }
}

impl Iterator for FizzBuzz {
    type Item = String;

    fn next(&mut self) -> Option<Self::Item> {
        // TODO(human): implement the iterator logic
        if self.current >= self.end {
            return None;
        }

        let result = match (self.current % 3, self.current % 5) {
            (0, 0) => "FizzBuzz".to_string(),
            (0, _) => "Fizz".to_string(),
            (_, 0) => "Buzz".to_string(),
            (_, _) => self.current.to_string(),
        };
        self.current += 1;
        Some(result)
    }
}
