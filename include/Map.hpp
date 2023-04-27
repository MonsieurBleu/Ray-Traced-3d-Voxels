#ifndef MAP_HPP
#define MAP_HPP

#include <Octree.hpp>

#define OCTREE_CHUNK_NB 5

class Map
{
    private :



    public :
        static_octree_buffer chunks[OCTREE_CHUNK_NB];

        OctNode& operator[](int);
        const OctNode& operator[](int) const;
        
        void send_to_gpu();

};

#endif