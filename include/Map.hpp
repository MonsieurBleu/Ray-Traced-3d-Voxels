#ifndef MAP_HPP
#define MAP_HPP

#include <Octree.hpp>
#include <Vectors.hpp>

#define OCTREE_CHUNK_NB 5

#define OCTREE_MAX_DEPTH 9

class Map
{
    private :
        static_octree_buffer chunks[OCTREE_CHUNK_NB];
        uint8_t Maxdepth = OCTREE_MAX_DEPTH;

        int dimension = 4<<OCTREE_MAX_DEPTH;
        int hdimension = 2<<OCTREE_MAX_DEPTH;

    public :

        OctNode& operator[](int);
        const OctNode & operator()(int) const;
        
        void send_to_gpu();
        void send_update();


        void draw_volume(VoxelSurface surface, 
                         vec3<int> vmin, 
                         vec3<int> vmax, 
                         OctPointer node_id = WORLD_OPTR,
                         int depth = 1);  


        void remove(int id);
        
        Octnode_ret add(VoxelSurface lod_surface);
};

#endif