'use strict'

let interfaceName = "FontFace";
let directory = "out";

const INTRO_TEXT = ''
+ `\nTo document the ${interfaceName} interface, MDN requires a page for the interface, \
\nitself a page for its constructor, and pages for each of its members. To \
\ncreate these pages, you'll be asked a series of questions about the \
\n${interfaceName} interface. The questions will be divided into several groups:\n \
\n* First, you'll be asked questions whose answers are shared among all the \
\n  pages to be created. \
\n* Next, you'll be asked questions that only apply to the ${interfaceName} page. \
\n* Additionally you'll be asked questions specific to each member of the \
\n  ${interfaceName} interface.\n \
\n The answers will be combined with page templates to create drafts for MDN \
\n pages. Drafts are written to the ${directory} directory.`;

console.log(INTRO_TEXT);
