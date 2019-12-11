#!/bin/bash


directory=$1
downloadDir=$2
passwordFile=$3
passwords=($(cat $passwordFile))
output=""
result="Failure"
for password in ${passwords[*]}; do
    files=()
    while IFS=  read -r -d $'\0'; do
        files+=("$REPLY")
    done < <(find "$downloadDir$directory" -name '*.rar' -print0 | sort)
    echo "Extracting ${files[@]}"
    dir_name=$(dirname "${files[0]}")
    cd "$dir_name"

    output=$(unrar x -p$password "$files")
    if [[ $output =~ .*"All OK" ]]; then
        result="Success"
        break
    fi
done

echo $result

