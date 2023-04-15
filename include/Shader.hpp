#ifndef SHADER_HPP
#define SHADER_HPP

#include <string>

#include <GL/glew.h>
#define GLFW_DLL
#include <GLFW/glfw3.h>

enum ShaderError
{
    ShaderOk,
    ShaderNoFile,
    ShaderCompileError,
    ShaderLinkingError
};

GLuint LoadShader(const char *vertex_path, const char *fragment_path);

class Shader
{
    private :
        GLuint type;
        GLuint shader;
        std::string Path;

    public :
        Shader(){};

        // Load the shader from the file at the given path
        // .vert for vertex shaders
        // .geom for geometry shaders
        // .frag for fragment shaders
        ShaderError load_from_file(const std::string& Path);

        GLuint get_shader(){return shader;};
};


#endif