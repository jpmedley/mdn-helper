# Reasons for Muted Items

This file explains the resons for items included in the `muted` list in `config.json`. (19/10/21)

## AbortController.reason

False positive. There is no such property. IDL processing is mistaking an abort() argument as a reason.

## CSSContainerRule

The feature has not shipped, but it's status vis a vis source files is not resolvable. It's status in Chromium is currently 'Proposed'. (20/10/21)

## FileSystemFileHandle.createSyncAccessHandle

Item is not in the current spec, but has yet to be removed from the IDL file. (19/10/21)

## FontManager

The feature has not shipped, but it's status vis a vis source files is not resolvable. (19/10/21)

## FontMetadata

The feature has not shipped, but it's status vis a vis source files is not resolvable. (19/10/21)

## FontTableMap

The feature has not shipped, but it's status vis a vis source files is not resolvable. (19/10/21)

## GPU*

Refers to any interface beginning with GPU. The feature has not shipped, but it's status vis a vis source files is not resolvable. (19/10/21)

## LaunchQueue

The feature has not shipped, but it's status vis a vis source files is not resolvable. (29/10/21)

## NativeIOFileManager

The feature has not shipped, but it's status vis a vis source files is not resolvable. (19/10/21)