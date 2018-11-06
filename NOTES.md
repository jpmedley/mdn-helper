# Development notes

NOT FOR RELEASE VERSION

## Feature: Memory

When doing multiple methods or properties, some questions have the same answer between members. Why not use the last-provided answer as the default for the current one, provided there is not a default in the questions file.

## New commands

`validate`: Validates that question files contain the same keys.

## To Do

* Change `shared:formalAPIName` to `shared:apiName` throughout. Anywhere that it should be suffixed with 'API' add it to the template. Give this a follow-up task that ensures it's not present twice.

* Deal more completely with inheritance.
