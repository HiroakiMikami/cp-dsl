cmake_minimum_required(VERSION 3.7)
project(cp-dsl)

# Common settings for the project
enable_testing()

# C++ settings
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -Wall -Wextra -D_GLIBCXX_DEBUG -D__LOCAL__")

# Enable google test
find_package(GTest REQUIRED)
include_directories(${GTEST_INCLUDE_DIRS})

file(GLOB files *.cc **/*.cc)

# Compile the test files
add_executable(benchmark ${files})
target_link_libraries(benchmark ${GTEST_BOTH_LIBRARIES})
target_link_libraries(benchmark pthread)
add_test(
        NAME run-benchmark
        COMMAND benchmark)
