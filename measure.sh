#!/bin/bash
URL=${2:8}
BASEDIR=$(pwd)/results/$1_${URL//[\/]/"_"}/round${3}
export NODE_OPTIONS=--max_old_space_size=32768

echo '------------------------------'
echo "$2 round $3"
echo "Cookies on "
echo " "

if [[ "$5" == "Y" ]]; then
    sitespeed.io --config config.json measure.mjs --multi --browsertime.suffix "$4"-SA --browsertime.scroll 1000 --browsertime.url "$2" --outputFolder "$BASEDIR"/run1 | grep -v '] INFO:'
elif [[ $5 == "N" ]]; then
    :
else
    sitespeed.io --config config.json measure.mjs --multi --browsertime.suffix "$4"-SA --browsertime.scroll 1000 --browsertime.cookie "$5" --browsertime.url "$2" --outputFolder "$BASEDIR"/run1 | grep -v '] INFO:'
fi

if [[ "$5" == "Y" ]]; then
    sitespeed.io --config config.json measure.mjs --multi --browsertime.suffix "$4"-nA --browsertime.scroll 0 --browsertime.url "$2" --outputFolder "$BASEDIR"/run2 | grep -v '] INFO:'
elif [[ $5 == "N" ]]; then
    :
else
    sitespeed.io --config config.json measure.mjs --multi --browsertime.suffix "$4"-nA --browsertime.scroll 0 --browsertime.cookie "$5" --browsertime.url "$2" --outputFolder "$BASEDIR"/run2 | grep -v '] INFO:'
fi

echo " "
echo "$2 round $3"
echo "Cookies off "
echo " "

if [[ "$6" == "Y" ]]; then
    sitespeed.io --config config.json measure.mjs --multi --browsertime.suffix "$4"-Sr --browsertime.scroll 1000 --browsertime.url "$2" --outputFolder "$BASEDIR"/run3 | grep -v '] INFO:'
elif [[ $6 == "N" ]]; then
    :
else
    sitespeed.io --config config.json measure.mjs --multi --browsertime.suffix "$4"-Sr --browsertime.scroll 1000 --browsertime.cookie "$6" --browsertime.url "$2" --outputFolder "$BASEDIR"/run3 | grep -v '] INFO:'
fi

if [[ "$6" == "Y" ]]; then
    sitespeed.io --config config.json measure.mjs --multi --browsertime.suffix "$4"-nr --browsertime.scroll 0 --browsertime.url "$2" --outputFolder "$BASEDIR"/run4 | grep -v '] INFO:'
elif [[ $6 == "N" ]]; then
    :
else
    sitespeed.io --config config.json measure.mjs --multi --browsertime.suffix "$4"-nr --browsertime.scroll 0 --browsertime.cookie "$6" --browsertime.url "$2" --outputFolder "$BASEDIR"/run4 | grep -v '] INFO:'
fi

echo '------------------------------'
echo " "
echo " "
