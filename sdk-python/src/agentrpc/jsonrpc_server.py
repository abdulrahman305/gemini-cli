from flask import Flask, request, jsonify
from jsonrpcserver import method, serve
from .client import AgentRPC
import os


app = Flask(__name__)


agent_rpc_client: AgentRPC | None = None


def get_agent_rpc_client() -> AgentRPC:
    global agent_rpc_client
    if agent_rpc_client is None:
        api_secret = os.environ.get("AGENTRPC_API_SECRET")
        if not api_secret:
            raise ValueError(
                "AGENTRPC_API_SECRET environment variable not set."
            )
        endpoint = os.environ.get(
            "AGENTRPC_API_ENDPOINT", "https://api.agentrpc.com"
        )
        agent_rpc_client = AgentRPC(api_secret, endpoint)
    return agent_rpc_client


@method
def get_cluster_id():
    client = get_agent_rpc_client()
    return client.get_cluster_id()


@method
def list_tools(params: dict):
    client = get_agent_rpc_client()
    return client.list_tools(params)


@method
def create_and_poll_job(cluster_id: str, tool_name: str, input_data: dict):
    client = get_agent_rpc_client()
    return client.create_and_poll_job(cluster_id, tool_name, input_data)


@app.route("/jsonrpc", methods=["POST"])
def index():
    return jsonify(serve(request.get_data().decode()))


if __name__ == "__main__":
    app.run(port=5000)