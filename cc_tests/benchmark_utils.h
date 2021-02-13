#pragma once

#include <chrono>


template <typename F>
std::chrono::milliseconds measure(F f, int n_measure = 10) {
    auto start = std::chrono::system_clock::now();
    for (int i = 0; i < n_measure; i++) {
        f();
    }
    auto end = std::chrono::system_clock::now();
    return std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
}
