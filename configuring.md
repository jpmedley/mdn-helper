# Configuring mdn-helper

## Configuring for engineering users

Sometimes its useful to let some users skip certain questions. For example, a
product manager or a browser feature developer should not be expected to know
how to fill in MDN-specific data (the value of the `APIRef` macro for example)
because it is not their job to know. Such users should use an alternative
questions file that specifies which questions should be skipped.

**To use the engineer question files

1. Open `config/default.json`.
1. Add the following to the `User` section.

`"questionsFile": "eng-questions.json"`
