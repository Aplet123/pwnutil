from pwn import *
p = process("test/delayed_print")
p.interactive()