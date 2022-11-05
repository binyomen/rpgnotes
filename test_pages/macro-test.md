---
title: Macro test
---

### Should output `undefined`

<div data-rpgnotes-macro="one_in_module"></div>

### Should output `{"myField":8}`

<span data-rpgnotes-macro="one_in_module {myField: 8}"></span>

### Should output `[1,2,3]` and then `<ul> <li>First</li> <li>Second</li> </ul> `

<div data-rpgnotes-macro="one_in_module [1 , 2, 3]">

* First
* Second

</div>

### Should output `<strong>strong text</strong>`

<div data-rpgnotes-macro="multiple_in_module.selectElement 'strong'">

**strong text**

</div>

### Scripts shouldn't be removed

<span data-rpgnotes-macro="script_test"></span>

See title of page.
