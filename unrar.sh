passwords=($<./passwords.txt))

directory=$1
output=""
result="Failure"
for password in ${passwords[*]}; do
    files=$(find "./$directory" -name '*.rar' | sort)
    echo "Extracting $files"
    cd "$(dirname \"$files\")"

    output=$(unrar x -p$password "$files")
    if [[ $output =~ .*"All OK" ]]; then
        result="Success"
        break
    fi
done

echo $result

