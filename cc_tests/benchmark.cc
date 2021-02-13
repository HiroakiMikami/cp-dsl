#include <gtest/gtest.h>
#include <functional>
#include <cstdint>
#include "benchmark_utils.h"


struct _Iterator {
    int64_t n;
    int64_t current;
};
void foreach(_Iterator& x, std::function<void(int64_t)> f) {
    for (auto i = int64_t(0); i < x.n; i++) {
        f(i);
    }
}
template <typename F>
void foreach_with_lambda(_Iterator& x, F f) {
    for (auto i = int64_t(0); i < x.n; i++) {
        f(i);
    }
}

TEST(LoopTest, PerformanceTest) {
    int64_t N = 100000;
    auto loop = measure([&]() {
        int64_t sum = 0;
        for (auto i = int64_t(0); i < N; i++) {
            sum += i * 2;
        }
    }, 100);
    auto foreach_fn = measure([&]() {
        int64_t sum = 0;
        auto it = _Iterator{N, 0};
        foreach(it, [&](int64_t i) { sum += i * 2; });
    }, 100);
    auto foreach_lambda = measure([&]() {
        int64_t sum = 0;
        auto it = _Iterator{N, 0};
        foreach_with_lambda(it, [&](int64_t i) { sum += i * 2; });
    }, 100);
    auto ref = double(loop.count()) / 100;
    auto target = double(foreach_fn.count()) / 100;
    auto target2 = double(foreach_lambda.count()) / 100;

    EXPECT_GT(target - ref, 1);
    EXPECT_LT(target2 - ref, 1);
}

TEST(FunctionTest, PerformanceTest) {
    int64_t N = 1000000;
    auto lambda = measure([&]() {
        auto f = [](int64_t i) { return i + 2; };
        int64_t sum = 0;
        for (auto i = int64_t(0); i < N; i++) {
            sum += f(i);
        }
    }, 1);
    auto function = measure([&]() {
        std::function<int64_t(int64_t)> f = [](int64_t i) { return i + 2; };
        int64_t sum = 0;
        for (auto i = int64_t(0); i < N; i++) {
            sum += f(i);
        }
    }, 1);

    auto ref = double(lambda.count()) / N;
    auto target = double(function.count()) / N;

    EXPECT_LT(ref - target, 1);
}