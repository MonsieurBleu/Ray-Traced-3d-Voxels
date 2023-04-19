#ifndef OCTREE_HPP
#define OCTREE_HPP

#include <iostream>

#define OCTREE_CHUNK_SIZE 0xFFFF
#define LEAF_LIMIT32 0x80000000;
#define LEAF_LIMIT8 0x80;

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

struct OctPointer
{
    uint16_t pos;
    uint16_t oct_chunk_pos;
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

#endif