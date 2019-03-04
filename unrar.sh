declare -a passwords=("soitgoes" "luelinks" "intotheinternet")

output=""
result="Failure"
dir="/media/large/User/Downloads/${1}"
for password in ${passwords[*]}; do
    file=$(find $dir -name '*.rar' | head -1)
    echo "Extracting $file"
    cd $dir
    output=$(unrar x -p$password $(printf %q $file))
    if [[ $output =~ .*"All OK" ]]
    then
        result="Success"
        break
    fi
done

echo $result

