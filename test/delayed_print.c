#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>

int main() {
    setvbuf(stdout, NULL, _IONBF, 0);
    puts("First print");
    sleep(1);
    puts("Second print");
    sleep(1);
    puts("Third print");
    sleep(1);
}