#ifndef OCTREE_HPP
#define OCTREE_HPP

#include <iostream>


#define OCTREE_CHUNK_SIZE 0xFFFFFF
#define LEAF_LIMIT32 0x80000000
#define LEAF_LIMIT8 0x80

struct ColorRGB
{
    uint8_t r, g, b;
};

struct ColorHSV
{
    uint8_t h, s, v;
};

struct VoxelSurface
{
    ColorRGB color;
    uint8_t info;
};

#define INCHUNK_POS_MASK 0x00FFFFFF
#define CHUNK_ID_MASK    0xFF000000 

struct OctPointer
{
    uint32_t fullpos;
    
    uint32_t inchunk_pos()
    {
        return fullpos & INCHUNK_POS_MASK;
    };
    uint32_t chunk_id()
    {
        return fullpos & CHUNK_ID_MASK;
    };
    void set_chunk_id(uint8_t id)
    {
        fullpos &= INCHUNK_POS_MASK;
        fullpos |= id<<24;
    }
};

union Voxel
{
    VoxelSurface surface;
    OctPointer   ptr;
};

struct OctNode
{
    VoxelSurface lod_surface;
    Voxel childs[8];
    Voxel parent;
};

#define OCTREE_CHUNK_SIZEB sizeof(OctNode)*OCTREE_CHUNK_SIZE

struct Octnode_ret
{
    int pos;
    OctNode* node;
};


struct static_octree_buffer
{
    OctNode *nodes = NULL;

    int chunk_id = 0;

    int size = 0;
    int bfrist_pos = 0; // buffer first empty position 
    bool is_full = false;

    int uinterval_beg = OCTREE_CHUNK_SIZE; // position of the start of the update interval
    int uinterval_end = -1; // position of the end of the update interval

    uint32_t ssbo;

    ~static_octree_buffer();

    void set_id(int id) {chunk_id = id;};

    void alloc();
    void free();

    void send_to_gpu();
    void send_update();

    Octnode_ret add(VoxelSurface lod_surface);

    void remove(int pos);
};



#endif