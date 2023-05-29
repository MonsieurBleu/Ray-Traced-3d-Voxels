#version 460

layout (points) in;
layout (triangle_strip, max_vertices = 128) out;

layout (location = 1) uniform sampler2D mainscreen;

void main()
{
    gl_Position = vec4(-1.0, -1.0, 0.0, 1.0);
    EmitVertex();

    gl_Position = vec4(-1.0, 1.0, 0.0, 1.0);
    EmitVertex();

    gl_Position = vec4(1.0, -1.0, 0.0, 1.0);
    EmitVertex();

    EndPrimitive();

    gl_Position = vec4(1.0, 1.0, 0.0, 1.0);
    EmitVertex();

    gl_Position = vec4(-1.0, 1.0, 0.0, 1.0);
    EmitVertex();

    gl_Position = vec4(1.0, -1.0, 0.0, 1.0);
    EmitVertex();

    EndPrimitive();
}