declare -a passwords=("soitgoes" "luelinks" "intotheinternet")

output=""
result="Failure"
for password in ${passwords[*]}; do
    file=$(find "/media/large/User/Downloads/${1}" -name '*.rar' | sort | head -1)
    echo "Extracting $file"
    cd "$(dirname "$file")"
    output=$(unrar x -p$password "$file"))
    if [[ $output =~ .*"All OK" ]]
    then
        result="Success"
        break
    fi
done

echo $result

