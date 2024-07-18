#!/bin/bash

# 检查 glslc 是否可用
if ! command -v glslc &> /dev/null
then
    echo "glslc not found. Please make sure it is installed and in your PATH."
    exit 1
fi

current_dir=$(pwd)

# 编译片段着色器
glslc $current_dir/data/homework/shaders/glsl/homework1/mesh.frag -o $current_dir/data/homework/shaders/glsl/homework1/mesh.frag.spv

# 检查编译是否成功
if [ $? -ne 0 ]; then
    echo "Error compiling fragment shader"
    exit 1
fi

# 编译顶点着色器
glslc $current_dir/data/homework/shaders/glsl/homework1/mesh.vert -o $current_dir/data/homework/shaders/glsl/homework1/mesh.vert.spv

# 检查编译是否成功
if [ $? -ne 0 ]; then
    echo "Error compiling vertex shader"
    exit 1
fi

echo "Shader compilation successful!"