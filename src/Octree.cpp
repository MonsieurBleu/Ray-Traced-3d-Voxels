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
        << "Error : [SOB::alloc] odes are arleady allocated\n"
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

    uinterval_beg = 0;
    uinterval_end = 0;

    GLuint ssbo = 0;
    glGenBuffers(1, &ssbo);
    glBindBuffer(GL_SHADER_STORAGE_BUFFER, ssbo);

    std::cout << TERMINAL_OK 
    << "Sending SSBO of size " << OCTREE_CHUNK_SIZE/1000000.0 << " Mb to the GPU";
    startbenchrono();

    glBufferData(GL_SHADER_STORAGE_BUFFER, OCTREE_CHUNK_SIZEB, nodes, GL_DYNAMIC_COPY);
    glBindBufferBase(GL_SHADER_STORAGE_BUFFER, OCTREE_BINDING_BASE_LOCATION + chunk_id, ssbo);
    glBindBuffer(GL_SHADER_STORAGE_BUFFER, 0);

    endbenchrono();
}

