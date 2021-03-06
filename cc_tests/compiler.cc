#include <gtest/gtest.h>
#include <cstdint>
#include <vector>
#include <map>

template <typename K, typename V>
V get(std::map<K, V> &x, K &key)
{
    return x[key];
}
template <typename V>
V get(std::vector<V> &x, int64_t &idx)
{
    return x[idx];
}
TEST(TemplateDeductionTest, TestGet)
{
    std::vector<int64_t> xs = {1, 2, 3};
    int64_t k = 0;
    EXPECT_EQ(get(xs, k), int64_t(1));
    std::map<int, int> ys = {{0, 1}};
    int k1 = 0;
    EXPECT_EQ(get(ys, k1), int(1));
}

struct _Iterator
{
    int64_t n;
};

template <typename F>
void foreach (_Iterator &x, F f)
{
    for (auto i = int64_t(0); i < x.n; i++)
    {
        f(i);
    }
}
template <typename V, typename F>
void foreach (std::vector<V> &xs, F f)
{
    for (auto &x : xs)
    {
        f(x);
    }
}
TEST(TemplateDeductionTest, TestForeach)
{
    _Iterator it{10};
    int64_t sum = 0;
    foreach (it, [&](auto i) { sum += i; })
        ;
    EXPECT_EQ(45, sum);
    sum = 0;
    std::vector<int64_t> xs = {1, 2, 3};
    foreach (xs, [&](auto i) { sum += i; })
        ;
    EXPECT_EQ(6, sum);
}

TEST(TemplateDeductionTest, RecursiveFunctionTest)
{
    auto _fact = [&](int64_t n, auto _fact) -> int64_t {
        auto fact = [&](int64_t n) -> int64_t {
            return _fact(n, _fact);
        };
        if (n == 1)
        {
            return 1;
        }
        else
        {
            return n * fact(n - 1);
        }
    };
    auto fact = [&](int64_t n) {
        return _fact(n, _fact);
    };
    EXPECT_EQ(int64_t(1), fact(1));
    EXPECT_EQ(int64_t(6), fact(3));
}
TEST(TemplateDeductionTest, ReturnVoid)
{
    auto _f = [&](int64_t n, auto _f) -> void {
        auto f = [&](int64_t n) -> void {
            return _f(n, _f);
        };
        if (n == 1)
        {
            return;
        }
        else
        {
            return f(n - 1);
        }
    };
    auto f = [&](int64_t n) -> void {
        return _f(n, _f);
    };
    f(10);
}

TEST(CompileTest, Call)
{
    int _x = 4;
    auto &x = _x;
    auto f = [&](int &x, int &y) { return x + y; };
    EXPECT_EQ(
        (([&]() {
            decltype(auto) a0 = 1 + 1;
            decltype(auto) a1 = x;
            return f(a0, a1);
        })()),
        6
    );
}
