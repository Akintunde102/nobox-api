#!/bin/bash

echo ">>> *Setting up Mongo"
mongo_container_name="nc_mongo"
mongo_image_name="ni_mongo"
mongo_persistent_folder="$HOME/mongo/n/data"

docker_run_container (){
    echo ">>> Running New Container based on Image"
    newContainer=$(docker run --name "$mongo_container_name" -d -p 27017:27017 -v "$mongo_persistent_folder":/data/db --env-file env/.local.env "$mongo_image_name")
    echo ">>> New Container Running: $mongo_container_name"
}

docker_build_image(){
    echo ">>> Entering Project Docker folder to create new Mongo Image"
    cd "docker"  || exit
    echo ">>> Creating new Mongo Image"
    if docker build  -f mongo.dockerfile -t "$mongo_image_name" .; then
        echo ">>> Successfully created new Mongo Image"
        cd ".."
    else
        echo "Docker Build Failed"
        exit 1
    fi
    echo ">>> Exiting Project Docker folder"
}

assert_docker_existence(){
    echo ">>> Checking if Docker is installed"
    if [[ $(which docker) && $(docker --version) ]]; then
        echo "Cool! Docker is already installed"
    else
        echo "Docker is not installed"
        exit 1;
    fi
}

assert_docker_running_status(){
    echo ">>> Checking if Docker is running"
    if (! docker stats --no-stream > /dev/null 2>&1; ); then
        echo "Docker is not running, Please start it"
        exit 1;
    else
        echo "Cool! Docker is already running"
    fi
}


assert_docker_existence
assert_docker_running_status

if [ "$1" == "--wipe-db" ] || [ "$2" == "--wipe-db" ]; then
    echo ">>> *Wiping Mongo DB"
    rm -rf "$mongo_persistent_folder"
    touch "$mongo_persistent_folder"/
    echo ">>> *Wiped Mongo DB"
fi

if [ "$1" == "--rebuild" ] || [ "$2" == "--rebuild" ]; then
    echo ">>> *Rebuilding Mongo Afresh"
    docker rm -f $mongo_container_name
    docker rmi -f $mongo_image_name
    docker_build_image
else
    if docker image inspect "$mongo_image_name"  > /dev/null 2>&1; then
        echo "🤔 Mongo Image Already Exists"
        if docker container inspect "$mongo_container_name" > /dev/null 2>&1; then
            docker stop "$mongo_container_name" > /dev/null 2>&1
            echo ">>> Stopped Mongo Container"
            docker rm -f "$mongo_container_name" > /dev/null 2>&1
            echo ">>> Deleted Mongo Container"
        fi
    else
        echo ">>> Mongo Image $mongo_image_name not found"
        docker_build_image
    fi
fi

docker_run_container



redis_server_container_name="redis-server"
redis_server_image_name="redis/redis-stack-server"

install_redis(){
    echo "🙌 Installing Redis"
    docker run -d --name "$redis_server_container_name" -p 6379:6379 "$redis_server_image_name":latest
    echo "💡 Installed Redis"
}

if docker image inspect "$redis_server_image_name"  > /dev/null 2>&1; then
    echo "🤔 Redis Image Already Exists"
    if docker container inspect "$redis_server_container_name" > /dev/null 2>&1; then
        docker stop "$redis_server_container_name" > /dev/null 2>&1
        echo ">>> Stopped Redis Container"
        docker rm -f "$redis_server_container_name" > /dev/null 2>&1
        echo ">>> Deleted Redis Container"
    fi
else
    echo ">>> Redis Image $redis_server_container_name not found"
fi


install_redis





