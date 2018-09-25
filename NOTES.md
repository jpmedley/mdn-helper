# Development notes

NOT FOR RELEASE VERSION

## Feature: Memory

When doing multiple methods or properties, some questions have the same answer between members. Why not use the last-provided answer as the default for the current one, provided there is not a default in the questions file.

## Feature: Question types

* String - Examples include most of what's there now.
* Enum - Example: `readOnly` would ask 'Is this item read only? Yes or No?' but would render 'read-only' or '' (empty string) respectively.
* Boolean
* List -

## New commands

`validate`: Validates that question files contain the same keys.
