#!/bin/bash

if [ !  -f "../dawnix/doc/API_SPECIFICATION.md" ]; then
	echo "dawnix 项目不存在或没有 api 文档"
	exit 1
fi

mkdir -p ./doc

if [ -f "./doc/API_SPECIFICATION.md" ]; then
	cp ./doc/API_SPECIFICATION.md ./doc/apispec-rep.md
fi

echo "正在同步 API 文档"
cp ../dawnix/doc/API_SPECIFICATION.md ./doc/API_SPECIFICATION.md

# 同步成功后，清理备份（或者保留备份以防万一）
if [ $? -eq 0 ]; then
    rm -f ./doc/apispec-rep.md
    echo "同步成功！"
else
    echo "同步失败，保留了原备份文件。"
fi
