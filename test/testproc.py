from pwn import *
p = process("./delayed_print")
print 1, p.recv()
print 2, p.recv()
print 3, p.recv()
print 4, p.recv()
