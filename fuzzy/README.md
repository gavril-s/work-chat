# Fuzzy Testing Setup

This directory contains fuzzy tests for the chat application. Fuzzy testing is a type of automated testing that provides random, invalid, or unexpected inputs to a program to find edge cases and potential vulnerabilities.

## Test Structure

- **auth_fuzz_test.go**: Tests authentication functionality (login/register)
- **message_fuzz_test.go**: Tests message handling and WebSocket communication
- **file_fuzz_test.go**: Tests file upload functionality

## Running Tests

To run all fuzz tests:

```bash
cd fuzzy
go test -fuzz . -fuzztime 10s
```

## Configuration

You can adjust the fuzz testing duration by modifying the `-fuzztime` parameter. For example, to run tests for 1 minute:

```bash
go test -fuzz . -fuzztime 1m
```

## Adding New Tests

1. Create a new test file in the `tests` directory
2. Follow the pattern of existing tests
3. Add seed corpus values to cover common cases
4. Add the test to the main test suite
