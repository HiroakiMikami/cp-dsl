#include <gtest/gtest.h>
#include <cstdint>
#include <vector>
#include <map>

template <typename K, typename V>
V get(std::map<K, V> &x, K& key) {
    return x[key];
}
template <typename V>
V get(std::vector<V> &x, int64_t &idx) {
    return x[idx];
}
TEST(TemplateDeductionTest, TestGet) {
    std::vector<int64_t> xs = {1, 2, 3};
    int64_t k = 0;
    EXPECT_EQ(get(xs, k), int64_t(1));
    std::map<int, int> ys = {{0, 1}};
    int k1 = 0;
    EXPECT_EQ(get(ys, k1), int(1));
}


struct _Iterator {
    int64_t n;
};

template <typename F>
void foreach(_Iterator &x, F f) {
    for (auto i = int64_t(0); i < x.n; i++) {
        f(i);
    }
}
template <typename V, typename F>
void foreach(std::vector<V>& xs, F f) {
    for (auto& x : xs) {
        f(x);
    }
}
TEST(TemplateDeductionTest, TestForeach) {
    _Iterator it{10};
    int64_t sum = 0;
    foreach(it, [&](auto i) {sum += i;});
    EXPECT_EQ(55, sum);
    sum = 0;
    std::vector<int64_t> xs = {1, 2, 3};
    foreach(xs, [&](auto i) {sum += i;});
    EXPECT_EQ(6, sum);
}
