#include <Octree.hpp>
#include <Utils.hpp>
#include <string.h> // memset supremacy
#include <Shader.hpp>

static_octree_buffer::~static_octree_buffer()
{
    free();
}

void static_octree_buffer::alloc()
{
    if(nodes)
    {
        std::cerr 
        << TERMINAL_ERROR 
        << "Error : [SOB::alloc] nodes are arleady allocated\n"
        << TERMINAL_RESET;
        return;
    }
    
    nodes = new OctNode[OCTREE_CHUNK_SIZE];
    memset(nodes, 0, OCTREE_CHUNK_SIZEB);
}

void static_octree_buffer::free()
{
    delete nodes;
    nodes = NULL;
}

void static_octree_buffer::send_to_gpu()
{
    if(!nodes)
    {
        std::cerr << TERMINAL_INFO 
        << "Info : [SOB::send_to_gpu] blocking sending request of non allocated nodes at SOB number " 
        << (int)chunk_id << "\n" 
        << TERMINAL_RESET;
        return;
    }

    uinterval_beg = OCTREE_CHUNK_SIZE;
    uinterval_end = -1;

    ssbo = 0;
    glGenBuffers(1, &ssbo);
    glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);

    std::cout << TERMINAL_OK 
    << "Sending SSBO of size " << OCTREE_CHUNK_SIZEB/1000000.0 << " Mb to the GPU";
    startbenchrono();

    glBufferData(GL_SHADER_STORAGE_BUFFER, OCTREE_CHUNK_SIZEB, nodes, GL_DYNAMIC_COPY);
    glBindBufferBase(GL_SHADER_STORAGE_BUFFER, OCTREE_BINDING_BASE_LOCATION + chunk_id, ssbo);
    glBindBuffer(GL_SHADER_STORAGE_BUFFER, 0);

    endbenchrono();
}

void static_octree_buffer::send_update()
{
    if(uinterval_end == -1) return;

    int size = (uinterval_end-uinterval_beg+1)*sizeof(OctNode);
    int offset = uinterval_beg*sizeof(OctNode);

    std::cout 
    << TERMINAL_OK 
    << "Sending to SSBO subdata of size " 
    << size
    << " bytes to the GPU";

    startbenchrono();
    glNamedBufferSubData(ssbo, offset, size, &nodes[uinterval_beg]);
    endbenchrono();

    uinterval_beg = OCTREE_CHUNK_SIZE;
    uinterval_end = -1;

}

Octnode_ret static_octree_buffer::add(VoxelSurface lod_surface)
{
    Octnode_ret ret = {-1, NULL};

    if(is_full)
    {
        std::cerr << TERMINAL_ERROR
        << "FATAL ERROR : [SOB::add] can't add node to arleady full buffer. Forced to return illegal values to prevent map from data corruption." 
        << TERMINAL_RESET;

        return ret;
    }

    int pos = 0;

    if(bfrist_pos != OCTREE_CHUNK_SIZE)
    {
        pos = bfrist_pos;
        bfrist_pos = OCTREE_CHUNK_SIZE;
    }    
    else
    {
        for(pos = 0; pos < OCTREE_CHUNK_SIZE; pos++)
        {
            if(*(uint32_t *)&nodes[pos].lod_surface == 0)
                break;
        }

        if(pos == OCTREE_CHUNK_SIZE) is_full = true;
    }

    ret = {pos, &nodes[pos]};

    if(ret.pos < uinterval_beg) uinterval_beg = ret.pos;
    if(ret.pos > uinterval_end) uinterval_end = ret.pos;

    size ++;

    return ret;
}

void static_octree_buffer::remove(int pos)
{
    memset(&nodes[pos], 0, sizeof(OctNode));

    if(pos < uinterval_beg) uinterval_beg = pos;
    if(pos > uinterval_end) uinterval_end = pos;
    if(pos < bfrist_pos) bfrist_pos = pos;

    is_full = false;
}
